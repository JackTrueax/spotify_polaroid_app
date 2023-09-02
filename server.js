// gets parameters from the url
function getHashParams() {
  var hashParams = {};
  var e,
    r = /([^&;=]+)=?([^&;]*)/g,
    q = window.location.hash.substring(1);
  while ((e = r.exec(q))) {
    hashParams[e[1]] = decodeURIComponent(e[2]);
  }
  return hashParams;
}

// formats millisecond time to minutes and seconds - MM:SS
function formatMs(time_in_ms) {
  minutes = Math.floor(time_in_ms / 60000);
  seconds = ((time_in_ms % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

/* 
updates table body with track information
params: 
  tableBody - element from html page
  tracklist - trackList data from API response
*/
function updateTableBody(trackList) {
  const tableBody = document.getElementById('trackTableBody');
  tableBody.innerHTML = ""
  for (const track of trackList) {

    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = track.id;

    const titleCell = document.createElement('td');
    titleCell.textContent = `${track.name}`;

    const nameCell = document.createElement('td');
    nameCell.textContent = `${track.artists.map(artist => artist.name)}`;

    const durationCell = document.createElement('td');

    let minutes = Math.floor(track.duration_ms / 60000);
    let seconds = ((track.duration_ms % 60000) / 1000).toFixed(0); //rounds to integer 
    durationCell.textContent = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;

    row.appendChild(idCell);
    row.appendChild(titleCell);
    row.appendChild(nameCell);
    row.appendChild(durationCell);

    tableBody.appendChild(row);
  }

}

function populatePolaroids(polaroidContainer, trackList) {
  polaroidContainer.innerHTML = '';
  if (trackList.length == 0) {
    trackList = [{album:{images:[{}, {url:"https://pic.onlinewebfonts.com/thumbnails/icons_294619.svg"}]}, id:"0", name:"no queue :(", artists: [{name: ""}]}];
  }
  for (const track of trackList) {
    const polaroid = document.createElement('div');
    polaroid.className = 'polaroid';

      const imgElem = document.createElement('img');
      imgElem.src = track.album.images[1].url;

      const idElem = document.createElement('p');
      idElem.textContent = track.id;
      const titleElem = document.createElement('p');
      titleElem.textContent = track.name;
      const nameElem = document.createElement('p');
      nameElem.textContent = `${track.artists.map(artist => artist.name)}`;

    polaroid.appendChild(imgElem);
    polaroid.append(idElem);
    polaroid.appendChild(titleElem);
    polaroid.appendChild(nameElem);

    polaroidContainer.appendChild(polaroid);
  }
}

// request top 10 tracks from spotify API
function retrieveTracks(timeRangeSlug, callback) {
  $.ajax({
    url: `https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=${timeRangeSlug}`,
    headers: {
      Authorization: "Bearer " + access_token,
    },
    success: function (response) {
      let data = {
        trackList: response.items,
        total: 0,
        json: true,
      };
      for (var i = 0; i < data.trackList.length; i++) {
        data.total += data.trackList[i].duration_ms;
        data.trackList[i].id = (i + 1 < 10 ? "0" : "") + (i + 1); // leading 0 so all numbers are 2 digits
      }
      const periodTranslate = {"short_term":"Last Month", "medium_term":"Last 6 Months", "long_term":"All Time"}
      document.getElementById("title").textContent = "My Top 10 " + periodTranslate[timeRangeSlug];
      callback(data);
    },
  });
}

// request user's current queue from spotify API
function getQueue(callback) {
  $.ajax({
    url: `https://api.spotify.com/v1/me/player/queue`,
    headers: {
      Authorization: "Bearer " + access_token,
    },
    success: function (response) {
      let data = {
        trackList: response.queue,
        total: 0,
        json: true,
      };
      for (var i = 0; i < data.trackList.length; i++) {
        data.total += data.trackList[i].duration_ms;
        data.trackList[i].id = (i + 1 < 10 ? "0" : "") + (i + 1); // leading 0 so all numbers are 2 digits
      }
      document.getElementById("title").textContent = "Current Queue";
      callback(data);
    }
  });
}

// get access tokens from the URL
let params = getHashParams();
let access_token = params.access_token,
  client = params.client,
  error = params.error;

if (error) {
  alert("There was an error during the authentication");
} else {
  console.log('no error during authentication!')
  if (access_token) {
    $.ajax({
      url: "https://api.spotify.com/v1/me",
      headers: {
        Authorization: "Bearer " + access_token,
      },
      success: function (response) {
        $("#login").hide();
        // $("#loggedin").show();
        document.getElementById("polaroid_container").removeAttribute("hidden");
        document.getElementById("title").removeAttribute("hidden");
        // document.getElementById("buttons").removeAttribute("hidden");
        document.getElementById("buttons").style.display = "block";
        retrieveTracks("short_term", function (data) {
          populatePolaroids(document.getElementById('polaroid_container'), data.trackList);
        });
      },
    });
  }
  else {
    console.log("no access token!");
  }
}

const polaroidContainer = document.getElementById('polaroid_container');
// assign functions to top tracks buttons
document.getElementById("short_term").addEventListener(
  "click",
  function () {
    retrieveTracks("short_term", function (data) {
      populatePolaroids(polaroidContainer, data.trackList);
    });
  },
  false
);
document.getElementById("medium_term").addEventListener(
  "click",
  function () {
    retrieveTracks("medium_term", function (data) {
      populatePolaroids(polaroidContainer, data.trackList);
    });
  },
  false
);
document.getElementById("long_term").addEventListener(
  "click",
  function () {
    retrieveTracks("long_term", function (data) {
      populatePolaroids(polaroidContainer, data.trackList);
    });
  },
  false
);
// assign function to current queue button
document.getElementById("queue_button").addEventListener(
  "click",
  function () {
    getQueue(function (data) {
      populatePolaroids(polaroidContainer, data.trackList);
    });
  },
  false
);