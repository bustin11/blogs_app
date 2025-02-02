use crate::app_data::MyError;


#[derive(Debug, Default)]
pub(super) struct Tokens {
    tokens: Vec<String>,
}

impl Tokens {
    fn push(&mut self, word: String) {
        if !word.is_empty() {
            self.tokens.push(word);
        }
    }
    fn finish(&mut self) {
        self.tokens.reverse();
    }
}

impl Iterator for Tokens {
    type Item = String;
    
    fn next(&mut self) -> Option<Self::Item> {
        self.tokens.pop()
    }
}

pub(super) fn tokenize(s: String) -> Result<Tokens, MyError> {
  let mut tokens = Tokens::default();
  let mut word = String::default();
  let mut i = 0;
  let mut chars = s.chars().peekable();

  let is_and = |i: usize, s: &str| {
      return i + 2 < s.len() && &s[i..i+3].to_lowercase() == "and";
  };
  let is_or = |i: usize, s: &str| {
      return i + 1 < s.len() && &s[i..i+2].to_lowercase() == "or";
  };

  while let Some(c) = chars.peek() {
      match c {
          '(' | ')' | ':' => {
              tokens.push(word.clone());
              word.clear();
              tokens.push(c.to_string());
              let _ = chars.next();
              i += 1;
          }
          ' ' => {
              tokens.push(word.clone());
              word.clear();
              let _ = chars.next();
              i += 1;
          }
          _ => {
              if is_and(i, &s) {
                  tokens.push("and".to_string());
                  let _ = (chars.next(), chars.next(), chars.next());
                  i += 3;
              } else if is_or(i, &s) {
                  tokens.push("or".to_string());
                  let _ = (chars.next(), chars.next());
                  i += 2;
              } else {
                  while let Some(c) = chars.peek() {
                      if *c == ' ' ||*c == ')' || *c == ':' || *c == '(' {
                          break;
                      }
                      i += 1;
                      word += &c.to_string();
                      let _ = chars.next();
                  }
              }
          }
      }
  }
  if !word.is_empty() {
      tokens.push(word);
  }
  tokens.finish();
  Ok(tokens)
}