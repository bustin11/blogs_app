#[actix_web::get("/ping")]
pub async fn ping() -> impl actix_web::Responder {
    "Pong!\n"
}
