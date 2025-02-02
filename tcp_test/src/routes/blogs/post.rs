use crate::{
    app_data::{AppData, MyError},
    blogs::blog_model::BlogJsonParams,
    middleware::SessionData,
};
use actix_web::{web, HttpResponse};

pub async fn post_blogs(
    app_data: web::Data<AppData>,
    params: actix_web::web::Json<BlogJsonParams>,
    session_data: SessionData,
) -> Result<HttpResponse, MyError> {
    let client = app_data.db_pool.get().await.unwrap();
    let sql_string = "
      INSERT INTO blogs
      (user_id, message, heading, title, chapter, question, active_version)
      VALUES
      ($1, $2, $3, $4, $5, $6, 0)
  ";
    println!("params are {params:?}");
    let x = serde_json::to_value(params.questions.clone()).unwrap();
    println!("{x:?}");
    client
        .execute(
            sql_string,
            &[
                &session_data.user_id,
                &params.message,
                &params.heading,
                &params.title,
                &params.chapter,
                &x,
            ],
        )
        .await
        .unwrap();
    Ok(HttpResponse::Ok().finish())
}
