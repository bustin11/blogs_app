use crate::app_data::{AppData, MyError};
use actix_web::{web, HttpResponse};

pub async fn delete_blogs(
    app_data: web::Data<AppData>,
    path: web::Path<uuid::Uuid>,
) -> Result<HttpResponse, MyError> {
    let client = app_data.db_pool.get().await.unwrap();
    let sql_string = "
      DELETE FROM BLOGS
      WHERE id = $1
  ";
    let blog_id = path.into_inner();
    client.execute(sql_string, &[&blog_id]).await.unwrap();
    Ok(HttpResponse::Ok().finish())
}
