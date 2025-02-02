use crate::{
    app_data::{AppData, MyError},
    blogs::tag_model::TagParams,
    middleware::SessionData,
};
use actix_web::{web, HttpResponse};

pub async fn add_tag(
    app_data: web::Data<AppData>,
    params: actix_web::web::Json<TagParams>,
    session_data: SessionData,
) -> Result<HttpResponse, MyError> {
    let sql_string = "
    INSERT INTO tags (user_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING
  ";
    let client = app_data.db_pool.get().await?;
    let res = client
        .execute(
            sql_string,
            &[&session_data.user_id, &params.tag_name],
        )
        .await?;
    if res == 0 {
        Ok(HttpResponse::Ok().finish())
    } else {
        Ok(HttpResponse::Created().into())
    }
}
