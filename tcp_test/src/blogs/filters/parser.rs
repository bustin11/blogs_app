use std::{iter::Peekable, rc::Rc, str::FromStr};

use derive_more::derive::Debug;

use crate::app_data::MyError;

use super::tokenizer::Tokens;

#[derive(serde::Serialize, serde::Deserialize, Debug, strum::Display, strum::EnumString)]
#[strum(serialize_all = "snake_case")]
pub enum Outline {
    Heading,
    Title,
    Chapter,
    Message,
    Question,
    Tag,
}

#[derive(
    serde::Serialize, serde::Deserialize, Debug, strum::Display, strum::EnumString, Clone, Copy,
)]
#[strum(serialize_all = "snake_case")]
pub enum Conjunction {
    // #[strum(serialize = "&")]
    And,
    // #[strum(to_string = "|")]
    Or,
    // #[strum(to_string = "\"\"")]
    Follow, // can only be used in SingleFilter
}

impl Conjunction {
    fn to_filters(&self, left: Filters, right: Filters) -> Result<Filters, MyError> {
        match self {
            Conjunction::And => Ok(Filters::And(Rc::new(left), Rc::new(right))),
            Conjunction::Or => Ok(Filters::Or(Rc::new(left), Rc::new(right))),
            Conjunction::Follow => Err(MyError::new("Follow not allowed", 400)),
        }
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct SingleFilter {
    outline: Outline,
    ts_query: String, // TODO(justin): is this safe? this is a postgres direct call lol
}

impl SingleFilter {
    fn to_sql_string(&self) -> Result<String, MyError> {
        match self.outline {
            Outline::Heading | Outline::Title | Outline::Message | Outline::Question => {
                Ok(format!(
                    "to_tsvector({}) @@ websearch_to_tsquery('{}')",
                    self.outline, self.ts_query
                ))
            }
            Outline::Tag => {
                // TODO(justin): this will only show matching tags, not all tags unfortunately
                Ok(format!("t.name ILIKE '%{}%'", self.ts_query))
            }
            Outline::Chapter => {
                if self.ts_query.parse::<i64>().is_ok() {
                    Ok(format!("{} = {}", self.outline, self.ts_query))
                } else {
                    Err(MyError::new("Chapter is not integer :(", 400))
                }
            }
        }
    }
}

#[derive(Debug, strum::Display)]
#[strum(serialize_all = "snake_case")]
pub enum Filters {
    Single(SingleFilter),
    And(Rc<Filters>, Rc<Filters>),
    Or(Rc<Filters>, Rc<Filters>),
}

impl Filters {
    pub fn to_sql_string(&self) -> Result<String, MyError> {
        match self {
            Filters::Single(single_filter) => single_filter.to_sql_string(),
            Filters::And(left, right) => Ok(format!(
                "({} AND {})",
                left.to_sql_string()?,
                right.to_sql_string()?
            )),
            Filters::Or(left, right) => Ok(format!(
                "({} OR {})",
                left.to_sql_string()?,
                right.to_sql_string()?
            )),
        }
    }
}

// fn parse_value(value: String) -> Result<TsQuery, MyError> {

// }

fn parse_key_values(tokens: &mut Peekable<Tokens>) -> Result<Filters, MyError> {
    match (
        tokens.next(),
        tokens.next().map(|x| x == ":"),
        tokens.next(),
    ) {
        (Some(key), Some(true), Some(value)) => {
            return Ok(Filters::Single(SingleFilter {
                outline: Outline::from_str(&key)?,
                ts_query: value,
            }));
        }
        (x, y, z) => {
            println!("{x:?} {y:?} {z:?}");
            return Err(MyError::new("Failed to parse key values", 400));
        }
    }
}

pub(super) fn parse_tokens(
    left_parens: &mut i64,
    tokens: &mut Peekable<Tokens>,
) -> Result<Option<Filters>, MyError> {
    let mut prev_filters: Option<Filters> = None;
    let mut conjunction: Option<Conjunction> = None;
    while let Some(token) = tokens.peek() {
        let token = token.to_lowercase();
        match token.as_str() {
            "(" => {
                *left_parens += 1;
                let _ = tokens.next(); // remove left paren
                let curr_filters = parse_tokens(left_parens, tokens)?;
                match (prev_filters, conjunction, curr_filters) {
                    (None, _, curr_filters) => {
                        prev_filters = curr_filters;
                    }
                    (Some(p), Some(c), Some(f)) => {
                        prev_filters = Some(c.to_filters(p, f)?);
                        conjunction = None;
                    }
                    (Some(_), _, _) => {
                        return Err(MyError::new("Can't do this", 400));
                    }
                }
            }
            ")" => {
                if *left_parens <= 0 {
                    return Err(MyError::new("Extra )", 400));
                }
                *left_parens -= 1;
                let _ = tokens.next();
                return Ok(prev_filters);
            }
            x => {
                if let Ok(conj) = Conjunction::from_str(x) {
                    conjunction = Some(conj);
                    let _ = tokens.next();
                } else {
                    let curr_filters = Some(parse_key_values(tokens)?);
                    match (prev_filters, conjunction, curr_filters) {
                        (None, _, curr_filters) => {
                            prev_filters = curr_filters;
                        }
                        (Some(p), Some(c), Some(f)) => {
                            prev_filters = Some(c.to_filters(p, f)?);
                            conjunction = None;
                        }
                        (Some(_), _, _) => {
                            return Err(MyError::new(format!("Need conjunction or value"), 400));
                        }
                    }
                }
            }
        }
    }
    return Ok(prev_filters);
}
