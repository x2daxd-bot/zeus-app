#!/bin/bash
API_KEY="0e538b02c5ce3325114150f1f0399cae"
echo "[+] Fetching Latest Movies from TMDB..."
curl -s "https://api.themoviedb.org/3/movie/now_playing?api_key=$API_KEY&language=ar" | jq '.results[] | {title: .title, id: .id, rating: .vote_average}' > latest_movies.json
echo "[!] Data Saved to latest_movies.json"
