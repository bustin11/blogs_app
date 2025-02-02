use std::{
    error::Error, fmt::Debug, future::{ready, Future, Ready}, pin::Pin
};

use actix_session::SessionExt;
use actix_web::{
    dev::{forward_ready, Service, ServiceRequest, ServiceResponse, Transform},
    FromRequest, HttpMessage,
};
use derive_more::derive::Display;
use futures_util::future::LocalBoxFuture;

use crate::app_data::MyError;

// There are two steps in middleware processing.
// 1. Middleware initialization, middleware factory gets called with
//    next service in chain as parameter.
// 2. Middleware's call method gets called with normal request.
pub struct SayHi;

// Middleware factory is `Transform` trait
// `S` - type of the next service
// `B` - type of response's body
impl<S, B> Transform<S, ServiceRequest> for SayHi
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error>,
    S::Future: 'static,
    B: 'static + Debug,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type InitError = ();
    type Transform = SayHiMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(SayHiMiddleware { service }))
    }
}

#[derive(Debug, Display)]
pub struct SayHiMiddleware<S> {
    service: S,
}

impl<S, B> Service<ServiceRequest> for SayHiMiddleware<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = actix_web::Error>,
    S::Future: 'static,
    B: 'static + Debug,
{
    type Response = ServiceResponse<B>;
    type Error = actix_web::Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        println!("Hi from start. You requested: {}", req.path());

        let session = req.get_session();
        let user_id = if let Some(user_id) = session.get::<i64>("user_id").unwrap() {
            println!("user logged in");
            user_id
        } else {
            println!("user not logged in");
            return Box::pin(async { Err(MyError::new("User not logged in", 401).into()) });
        };
        // TODO(justin): security warning, need to make sure user is tied to the blog and tag model

        let session_data = SessionData { user_id };
        let _ = req.extensions_mut().insert(session_data);
        let fut = self.service.call(req);

        Box::pin(async move {
            let res = fut.await;
            match res {
                Ok(response) => {
                    match response.response().error() {
                        Some(x) => {
                            println!("[{}] from response, response is {:?}", x.error_response().status(), x.error_response().body());
                        },
                        None => {
                            println!("hi from response :)");
                        },
                    }
                    Ok(response)
                }
                Err(e) => {
                    println!("[{}] Error is {:?}", e.error_response().status(), e.error_response());
                    Err(e)
                }
            }
        })
    }
}

#[derive(Clone)]
pub struct SessionData {
    pub user_id: i64,
}

impl FromRequest for SessionData {
    type Error = Box<dyn Error>;
    type Future = Pin<Box<dyn Future<Output = Result<Self, Self::Error>>>>;

    fn from_request(
        req: &actix_web::HttpRequest,
        _payload: &mut actix_web::dev::Payload,
    ) -> Self::Future {
        let session = req.extensions().get::<SessionData>().unwrap().clone();
        Box::pin(async move { Ok(session) })
    }
}
