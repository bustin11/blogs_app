use actix_web::{web, HttpResponse};

use crate::{
    app_data::{AppData, MyError},
    blogs::blog_model::LoginPayload,
};

pub async fn sign_up(
    payload: web::Form<LoginPayload>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse, MyError> {
    let client = app_data.db_pool.get().await?;
    client
        .execute(
            "INSERT INTO users (name, password) VALUES ($1, $2)",
            &[&payload.username, &payload.password],
        )
        .await?;
    Ok(HttpResponse::Ok().json("Sign up Successful!"))
}
