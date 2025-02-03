
# What
This application is used to keep track of your daily thoughts

# Why 
I had all these thoughts that I wanted to write down and search for, but I'm not good at keeping at it, so I made this to get started

# Who
2 guys will maintain this

# How

Please start from the 1st to last step

## Getting started
```
git clone https://github.com/bustin11/blogs_app
```

## Setting up Backend
Make sure you have `docker` installed. I like dockerhub, so I downloaded from https://docs.docker.com/docker-hub/quickstart/
Sanity check by running 
```
cd blogs_app/tcp_test # this contains the backend service
docker compose up --detach # (start up a postgres docker container) 
```

## Setting up Frontend
Make sure you have node installed! Follow https://docs.npmjs.com/downloading-and-installing-node-js-and-npm or another guide. You should be able to run 
```
node -v
npm -v
``` 

```
cd ../my-app # this contains the frontend service
npm start # this should start
```

if `npm start` fails, just install each dependency 1 by 1.

## Setting Postgres
From the _Setting up Backend_ section, you created a docker image and a container to run a SQL database with a port exposed on localhost at 5432. We now need to setup Postgres to by creating some tables
```
cd ../meta
psql -h localhost -p 5432 -U postgres -d blogs -f ~/tcp_server/meta/migrations.pgsql
```
Now the migrations are all run!!

## Running the server
Install Cargo, the build manager for Rust, which is the language of the Backend. Follow guide https://doc.rust-lang.org/cargo/getting-started/installation.html.

Ok now
```
cd ../tcp_test
cargo run --bin http_server # this will run the server on port 8080
```

## Running the Frontend
```
cd ../my-app
npm start # this will start the typescript react app on port 3000
```
Navigate to http://localhost:3000

It should be intuitive how to login or signup, and once you're, you can play around with it to get a feel.