use actix_session::Session;
use actix_web::{web, HttpResponse};

use crate::{
    app_data::{AppData, MyError},
    blogs::blog_model::LoginPayload,
};

pub async fn login(
    session: Session,
    payload: web::Form<LoginPayload>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse, MyError> {
    let client = app_data.db_pool.get().await?;
    let mut rows = client
        .query(
            "SELECT check_password($1, $2)",
            &[&payload.username, &payload.password],
        )
        .await?;
    match rows.pop() {
        Some(row) => {
            let id: i64 = row
                .try_get("check_password")
                .map_err(|_| MyError::new("User password incorrect", 404))?;
            session.insert("user_id", id).unwrap();
            Ok(
                HttpResponse::Ok()
                    .json(serde_json::json!({"id": id, "username": payload.username})),
            )
        }
        None => Err(MyError::new("User not found", 404)),
    }
}
