use std::fmt::Debug;

use actix_web::{
    http::{self, StatusCode},
    ResponseError,
};

#[derive(Clone)]
pub struct AppData {
    pub db_pool: std::sync::Arc<deadpool::managed::Pool<deadpool_postgres::Manager>>,
}

// #[derive(Display, Debug, thiserror::Error)]
// pub enum NewError {
//     DbPool(#[from] deadpool_postgres::PoolError)
// }

// impl serde::Serialize for NewError {
//     fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//         where
//             S: serde::Serializer {
//         serializer.serialize_map(len)
//     }
// }

#[derive(serde::Serialize, Debug, thiserror::Error)]
pub struct MyError {
    error_msg: String,
    status_code: u16,
}

impl From<actix_web::Error> for MyError {
    fn from(value: actix_web::Error) -> Self {
        Self::new(
            value.to_string(),
            value.as_response_error().status_code().as_u16(),
        )
    }
}

impl From<deadpool_postgres::tokio_postgres::Error> for MyError {
    fn from(value: deadpool_postgres::tokio_postgres::Error) -> Self {
        Self::new(value.to_string(), 500)
    }
}

impl From<serde_json::Error> for MyError {
    fn from(value: serde_json::Error) -> Self {
        Self::new(value.to_string(), 400)
    }
}

impl<E: Debug> From<deadpool::managed::PoolError<E>> for MyError {
    fn from(value: deadpool::managed::PoolError<E>) -> Self {
        Self::new(format!("{value:?}"), 500)
    }
}

impl From<strum::ParseError> for MyError {
    fn from(value: strum::ParseError) -> Self {
        Self::new(value.to_string(), 400)
    }
}

impl MyError {
    pub fn new(error_msg: impl Into<String>, status_code: u16) -> Self {
        Self {
            error_msg: error_msg.into(),
            status_code,
        }
    }
}

impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = serde_json::to_string(self).unwrap();
        write!(f, "{s}")
    }
}

impl ResponseError for MyError {
    fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
        let status_code = to_status_code(self.status_code);
        actix_web::HttpResponseBuilder::new(status_code)
            .insert_header((http::header::ACCESS_CONTROL_ALLOW_CREDENTIALS, "true"))
            .insert_header((
                http::header::ACCESS_CONTROL_ALLOW_ORIGIN,
                "http://localhost:3000",
            ))
            .json(self)
    }
}

fn to_status_code(status_code: u16) -> StatusCode {
    let x = status_code / 100;
    match x {
        2 => StatusCode::OK,
        3 => StatusCode::TEMPORARY_REDIRECT,
        4 => {
            if status_code == 400 {
                StatusCode::BAD_REQUEST
            } else {
                StatusCode::UNAUTHORIZED
            }
        }
        _ => StatusCode::INTERNAL_SERVER_ERROR,
    }
}
