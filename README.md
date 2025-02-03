
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

# Searching
## Create a blog
Once you login, you will see 0 blogs and an empty search bar. On the top left you can go to the blog form page to submit a blog. After submitting, it will redirect you to blogs page where you can view your blogs.

## How to search
Once you have your blog, you can type any string, and it will match case insensitive to any part of the text in the blog. More specifically, the your search pattern will be matched against `heading`, `title`, `chapter`, `message`, `questions`. 

## Advanced search
By typing one of the things to search for, ie, `heading`, we can write a query like `heading: Corinthians`. We can also combine statements like so: `heading: Corinthians OR heading: Acts`. We can get fancier with parenthesis support: `(heading: Corinthians OR heading: Acts) AND chapter: 7`. Note that if errors pop up, ignore them, in fact, ignore any error, that's just a debug thing I was using to spot errors, but they don't mean anything. True errors are ones where the behavior is unexpected. 

# Adding Tags
You can add tags, which are globally unique to each user, into a bucket by pressing the `Add Tag Please` button on the top. Type the name of the tag, and hit submit. This button will also allow you to edit tag names, as well as delete tags and view the list of available tags. Once you created a tag, now you can add it to a blog by going underneath one of the blogs and adding it. It will show up on the bottom

# Versions
Any update of the blog will create a version, followed by the most recent version being showed. You can view all versions by clicking the `Versions` button to view the list of versions and when they were created. Click on one to view. Now that you are viewing one, you can revert to that version. IMPORTANT: If you revert to a version, your version history will be kept in tack, ie, you can see past **and** future versions. HOWEVER, if you edit a past version, the future versions will be **erased**

# Contributions
Please submit a PR