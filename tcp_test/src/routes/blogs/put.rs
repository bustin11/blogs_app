use crate::{
    app_data::{AppData, MyError},
    blogs::blog_model::BlogJsonParams,
    middleware::SessionData,
};
use actix_web::{web, HttpResponse};

// TODO(justin): update this endpoint to first
/// 
pub async fn put_blogs(
    app_data: web::Data<AppData>,
    path: web::Path<uuid::Uuid>,
    params: actix_web::web::Json<BlogJsonParams>, // Do we need a separate endpoint to update the version?
    session_data: SessionData,
) -> Result<HttpResponse, MyError> {
    let client = app_data.db_pool.get().await.unwrap();
//     let sql_string = "
//       INSERT INTO blogs
//       (message, heading, title, chapter, question, id, user_id)
//       VALUES
//       ($1, $2, $3, $4, $5, $6, $7)
//       ON CONFLICT (id)
//       DO UPDATE
//       SET 
//       message = $1,
//       heading = $2,
//       title = $3,
//       chapter = $4,
//       question = $5,
//       user_id = $7
//   ";
  let sql_string = "
    UPDATE blogs
    SET 
    message = $1,
    heading = $2,
    title = $3,
    chapter = $4,
    question = $5,
    user_id = $7
    WHERE id = $6
  ";
    let x = serde_json::to_value(params.questions.clone()).unwrap();
    let post_id = path.into_inner();
    let _ = client
        .execute(
            sql_string,
            &[
                &params.message,
                &params.heading,
                &params.title,
                &params.chapter,
                &x,
                &post_id,
                &session_data.user_id,
            ],
        )
        .await
        .unwrap();
    Ok(HttpResponse::Ok().finish())
}
