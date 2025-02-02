use crate::app_data::MyError;
use actix_session::Session;
use actix_web::HttpResponse;

pub async fn logout(session: Session) -> Result<HttpResponse, MyError> {
    session.purge();
    Ok(HttpResponse::Ok().finish())
}
