use crate::app_data::MyError;


pub mod parser;
pub mod tokenizer;

pub fn parse_string(s: String) -> Result<Option<parser::Filters>, MyError> {
  let tokens = tokenizer::tokenize(s)?;
  println!("tokens are {tokens:?}");
  let mut tokens = tokens.peekable();
  parser::parse_tokens(&mut 0, &mut tokens)
}