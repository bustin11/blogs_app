use crate::{
    app_data::{AppData, MyError},
    blogs::tag_model::TagParams,
    middleware::SessionData,
};
use actix_web::{web, HttpResponse};
use uuid::Uuid;

pub async fn update_tag(
    app_data: web::Data<AppData>,
    path: web::Path<Uuid>,
    params: actix_web::web::Json<TagParams>,
    session_data: SessionData,
) -> Result<HttpResponse, MyError> {
    let sql_string = "
    UPDATE tags
    SET name = $3
    WHERE user_id = $2 and id = $1
  ";
    let tag_id = path.into_inner();
    println!("updating tag with params: {params:?}, {tag_id}");
    let client = app_data.db_pool.get().await?;
    let _ = client
        .execute(
            sql_string,
            &[&tag_id, &session_data.user_id, &params.tag_name],
        )
        .await?;
    Ok(HttpResponse::Ok().finish())
}
