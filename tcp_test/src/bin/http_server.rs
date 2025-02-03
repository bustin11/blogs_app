
use actix_session::{storage::CookieSessionStore, SessionMiddleware};
use actix_web::{cookie::Key, http, web};
use tcp_test::{
    app_data::AppData,
    middleware::SayHi,
    routes::{
        auth::{login, logout, ping::ping, sign_up::sign_up},
        blogs::{delete::delete_blogs, get::get_blogs, list_versions::list_blog_versions, post::post_blogs, put::put_blogs, set_version::set_blog_version, tags::{add_tag::add_tag_to_blog, remove_tag::remove_tag_from_blog}, version::get_blog_version}, tags::{add::add_tag, delete::delete_tag, list::list_tags, update::update_tag},
    },
};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let tcp_listener = std::net::TcpListener::bind("127.0.0.1:8080")?;
    run(tcp_listener).await?.await?;
    Ok(())
}

async fn run(tcp_listener: std::net::TcpListener) -> std::io::Result<actix_web::dev::Server> {
    let mut cfg = deadpool_postgres::Config::new();
    cfg.dbname = Some("blogs".to_string());
    cfg.manager = Some(deadpool_postgres::ManagerConfig {
        recycling_method: deadpool_postgres::RecyclingMethod::Fast,
    });
    cfg.host = Some("localhost".to_string());
    cfg.port = Some(5432);
    cfg.user = Some("postgres".to_string());
    cfg.password = Some("password".to_string());
    let pool = cfg
        .create_pool(
            Some(deadpool::Runtime::Tokio1),
            deadpool_postgres::tokio_postgres::NoTls,
        )
        .expect("failed to create pool");
    let app_data = AppData {
        db_pool: pool.into(),
    };

    let server = actix_web::HttpServer::new(move || {
        let cors = actix_cors::Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_methods(vec!["GET", "POST", "DELETE", "PUT"])
            .allowed_headers(vec![
                http::header::ACCEPT,
                http::header::ACCEPT_ENCODING,
                http::header::ACCEPT_LANGUAGE,
                http::header::AUTHORIZATION,
                http::header::ACCESS_CONTROL_ALLOW_CREDENTIALS,
                http::header::CONTENT_TYPE,
                http::header::CONNECTION,
                http::header::COOKIE,
                http::header::HOST,
                http::header::ORIGIN,
                http::header::REFERER,
                http::header::USER_AGENT,
                http::header::X_FORWARDED_PROTO,
            ])
            .supports_credentials()
            .max_age(5);
        actix_web::App::new()
            .app_data(web::Data::new(app_data.clone()))
            .wrap(cors)
            .service(
                web::scope("/api/v0")
                    .service(ping)
                    .route("/login", web::post().to(login::login))
                    .route("/logout", web::post().to(logout::logout))
                    .route("/sign_up", web::post().to(sign_up)),
            )
            .service(
                web::scope("/api/v1")
                    .wrap(SayHi)
                    .service(
                        web::resource("/blogs")
                        .route(web::get().to(get_blogs))
                        .route(web::post().to(post_blogs))
                    )
                    .service(
                        web::resource("/tags")
                        .route(web::post().to(add_tag))
                        .route(web::get().to(list_tags))
                    )
                    .service(
                        web::resource("/tags/{tag_id}")
                        .route(web::put().to(update_tag))
                        .route(web::delete().to(delete_tag))
                    )
                    .service(
                        web::resource("/blogs/{post_id}")
                            .route(web::put().to(put_blogs))
                            .route(web::delete().to(delete_blogs)),
                    ).service(
                        web::resource("/blogs/{post_id}/versions")
                            .route(web::get().to(list_blog_versions))
                    )
                    .service(
                        web::resource("/blogs/{post_id}/tags/{tag_id}")
                            .route(web::post().to(add_tag_to_blog))
                            .route(web::delete().to(remove_tag_from_blog)),
                    )
                    .service(
                        web::resource("/blogs/{post_id}/version/{version_id}")
                            .route(web::get().to(get_blog_version))
                    )
                    .service(
                        web::resource("/blogs/{post_id}/version/{version_id}/set")
                            .route(web::post().to(set_blog_version))
                    ),
            )
            .wrap(
                SessionMiddleware::builder(CookieSessionStore::default(), Key::from(&[0; 64]))
                    .cookie_secure(true)
                    .cookie_same_site(actix_web::cookie::SameSite::None)
                    .build(),
            )
    })
    .listen(tcp_listener)?
    .run();
    Ok(server)
}
