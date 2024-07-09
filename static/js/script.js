let audio = new Audio();
let songslist;
let lastsearch;
let library = []; 

songsqueue=[]

const playmusic = (songTitle,songsList,pause=false) => {
    playButton.src="../static/img/play.svg";
    const song = songsList.find(s => s.trackName.toLowerCase() === songTitle.toLowerCase());
    if (song) { 
        if (audio) {
            audio.pause();
        }
        audio.src = song.audioUrl;
        if (!pause){
            audio.play()
            playButton.src="../static/img/pause.svg"
        }   
        document.querySelector('.songinfo').innerHTML=`<div class="marquee-container"><div class="marquee">${song.trackName}</div></div>`;
        document.querySelector('.songtimer').innerHTML="00:00/00:00";
        document.querySelector('.circle').style.left=0+'%';
    } 
}

function secondsToMinutesSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function findSongIndexByUrl(url,songslist) {
    for (let i = 0; i < songslist.length; i++) {
        if (songslist[i].audioUrl === url) {
            return i;
        }
    }
    return -1;  // Return -1 if not found
}

function update_library(songslist){
    let songUL=document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML='';
    for (const song of songslist){
        songUL.innerHTML=songUL.innerHTML+`<li> <img src="${song.artworkUrl}" alt=""> <div class="info"><div class="trackname truncate">${song.trackName}</div> <div class="artist">${song.artistName}</div></div> <div class="playnow"><img src="../static/img/playnow_highlighted.svg" alt=""> </div></li>`;
    }

    // play songs directly
    Array.from(document.querySelector('.songlist').getElementsByTagName('li')).forEach(e=>{
        e.addEventListener('mouseenter', () => {
            e.getElementsByClassName('playnow')[0].style.display='block';  // Access the first <img> element within `e`
        });
        
        e.addEventListener('mouseleave', () => {
            e.getElementsByClassName('playnow')[0].style.display='none'  // Access the first <img> element within `e`
        });

        e.addEventListener('click', () => {
            playmusic(e.querySelector('.info').firstChild.innerHTML,songslist);
        })
    })
}

async function displayAlbums(topic, index) {
    let response = await fetch(`/albums?topic=${encodeURIComponent(topic)}`);
    let albums = await response.json();
    
    if (albums.length > 0) {
        for (let i = 0; i < albums.length; i++) {
            let album = albums[i];
            document.getElementsByClassName('spotifyPlaylist')[index].getElementsByTagName('h1')[0].innerHTML = `${topic}`;
            
            let cardContainer = document.getElementsByClassName('cardContainer')[index];
            cardContainer.innerHTML += `<div data-file=${album.name.replaceAll(" ","_")} class="card">
                <div class="play">
                    <img src="../static/img/albums-play.svg" alt="play" />
                </div>
                <img src=${album.cover_img} alt="" />
                <h1 class='truncate' >${album.name}</h1>
                <p>${album.description}</p>
                </div>`;
        }

        let cards = document.getElementsByClassName('cardContainer')[index].getElementsByClassName('card');
        Array.from(cards).forEach(card => {
            card.addEventListener('click', async (event) => {
                backward=current;
                let albumName = event.currentTarget.dataset.file;
                current=`album/${albumName}`;
                console.log(`Card clicked with albumName: ${albumName}`);
                let songsResponse = await fetch(`/songs/${albumName}`);
                songslist = await songsResponse.json();
                songsqueue=songslist
                if (songslist.length > 0) {
                    playmusic(songslist[0].trackName, songslist);
                    update_library(songslist);
                } else {
                    let songUL = document.querySelector(".songlist ul");
                    songUL.innerHTML = `<div class="noResult"> No results </div>`;
                }
            });
        });
    } else {
        console.log("No albums found.");
    }
}

async function display() {
    const topics = ["Best Of Artists","YourPlaylists", "YourArtistMixes", "YourDecadeMixes"];
    for (let i = 0; i < topics.length; i++) {
        await displayAlbums(topics[i], i);
    }
}

async function searchSongs(searchTerm){
    let result_songs=[];
    var url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=40`;
        try{
            const response = await fetch(url, {
                credentials: 'omit' // Ensure no cookies are sent with the request
            });
            let data=await response.json();

            if (data.results.length>0){
                for (let i = 0; i < data.results.length && i < 40; i++) {
                    const result=data.results[i];
                    song={
                        result : data.results[i],
                        artistName : result.artistName,
                        trackName : result.trackName,
                        albumName : result.collectionName,
                        artworkUrl : result.artworkUrl100,
                        audioUrl : result.previewUrl,
                        explicit : result.trackExplicitness,
                        duration: result.trackTimeMillis/60000
                    }
                    result_songs.push(song);
                }
                console.log(result_songs);
                update_library(result_songs);
                
            }
            else{
                console.log(`No results found for ${searchTerm}`);
                let songUL=document.querySelector(".songlist").getElementsByTagName("ul")[0];
                songUL.innerHTML='';
                songUL.innerHTML=songUL.innerHTML+`<div class="noResult"> No results found for "${searchTerm}"<div>`;
            }
        }
        catch(error){
            console.error("error fetching songs",error);
        }
}

async function home(){  
    backward=current;
    current="home";
    let songsResponse = await fetch(`/songs/library`);
    songslist = await songsResponse.json();
    playmusic(songslist[0].trackName, songslist,true);
    update_library(songslist);
    document.querySelector('.searchBar').style.display="none";
    document.querySelector('.searchButton a').style.display = 'block';
    document.querySelector('.library h2').innerHTML="Your Library";
    search.style.display = 'flex';
}

async function album(albumName){
    let songsResponse = await fetch(`/songs/${albumName}`);
    songslist = await songsResponse.json();
    if (songslist.length>0){
        playmusic(songslist[0].trackName, songslist);
        update_library(songslist);
    }
    else{
        let songUL=document.querySelector(".songlist").getElementsByTagName("ul")[0];
        songUL.innerHTML='';
        songUL.innerHTML=songUL.innerHTML+`<div class="noResult"> No results <div>`;
    }
}


let current='home';
let backward='home';
let forward='home';

var modal = document.getElementById("myModal");
function openModal() {
  modal.style.display = "block";
}
function closeModal() {
  modal.style.display = "none";
}

async function addPlaylist(){
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
    document.getElementById("playlistForm").onsubmit = function(event) {
      var playlistName = document.getElementById("playlistName").value;
      console.log("Playlist Name:", playlistName);  
      closeModal();
    }
}


async function main(){ 
   
    // gets the list of songs that is present on top we can update the list later when we give the user option to add songs to his library
    let songsResponse = await fetch(`/songs/library`);
    songslist = await songsResponse.json();
    playmusic(songslist[0].trackName, songslist,true);
    update_library(songslist);
    display();

    addPlaylist();

    // search
    document.querySelector('.searchButton').addEventListener('click',()=>{
        document.querySelector('.searchBar').style.display="flex";
        document.querySelector('.searchButton a').style.display = 'none';
        search.style.display = 'none';
    })
    document.getElementById('search-bar').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission behavior
            const searchInput = document.getElementById('search-bar');
            const searchTerm = searchInput.value.trim(); // Trim whitespace from the input
            if (searchTerm !== '') {
                backward = current;
                current = searchTerm;
                lastsearch = searchTerm;
                document.querySelector('.library h2').innerHTML = "Search Results";
                searchSongs(searchTerm);
            }
        }
    });
    
    document.getElementById('search-button').addEventListener('click', function() {
        const searchInput = document.getElementById('search-bar');
        const searchTerm = searchInput.value.trim(); // Trim whitespace from the input
        if (searchTerm !== '') {
            backward = current;
            current = searchTerm;
            lastsearch = searchTerm;
            document.querySelector('.library h2').innerHTML = "Search Results";
            searchSongs(searchTerm);
        }
    });
    
    document.querySelector('.homeButton').addEventListener('click', async ()=>{
        home();
    })


    // signup
    const signupbtn=document.querySelector('.signupbtn');
    if (signupbtn){
        signupbtn.addEventListener('click',()=>{
            console.log("sign up");
        })
    }

    // // forward
    document.querySelector(".forward").addEventListener('click', ()=>{
        if(forward!=current){
            backward=current;
            current=forward;
        }
        if (forward==lastsearch){
            searchSongs(lastsearch);
        }
        else if (forward=='home'){
            home();
        }
        else if (forward.split('/')[0]=='album'){
            album(forward.split('/')[1]);
        }
    })

    // backward
    document.querySelector(".backward").addEventListener('click', ()=>{
        if (backward!=current){
            forward=current;
            current=backward;
        }
        if (backward==lastsearch){
            searchSongs(lastsearch);
        }
        else if (backward=='home'){
            home();
        }
        else if (backward.split('/')[0]=='album'){
            album(backward.split('/')[1]);
        }
    })

    // playbar
    playButton.addEventListener('click', () => {
        if (audio.src){
            if (audio.paused){
                audio.play()
                playButton.src="../static/img/pause.svg";
                console.log("Playing audio");
            }
            else{
                if (audio && !audio.paused) {
                    playButton.src="../static/img/play.svg";
                    audio.pause();
                    console.log("Paused audio");
                }
            }
        }
    }); 

    // next song
    nextButton.addEventListener('click', () => {
        let i=findSongIndexByUrl(audio.src,songslist);
        i=(i+1)%(songslist.length);
        song=songslist[i].trackName;
        playmusic(song,songslist);
    }); 
    
    // prev song
    prevButton.addEventListener('click', () => {
        let i=findSongIndexByUrl(audio.src,songslist);
        i=(i - 1 + songslist.length)%(songslist.length);
        song=songslist[i].trackName;
        playmusic(song,songslist);
    }); 

    // listen for time update
    audio.addEventListener('timeupdate',() => {
        document.querySelector('.songtimer').innerHTML=`${secondsToMinutesSeconds(audio.currentTime)}/${secondsToMinutesSeconds(audio.duration)}`;
        document.querySelector(".circle").style.left=(audio.currentTime/audio.duration)*100 + "%";
        if (audio.currentTime == audio.duration ){
            playButton.src="../static/img/play.svg";
            let i=findSongIndexByUrl(audio.src,songslist);
            i=(i+1)%(songslist.length);
            song=songslist[i].trackName;
            audio.pause();
            setTimeout(function() {
                playmusic(song, songslist);
            }, 1200);
        }

    })

    // seek song 
    document.querySelector(".seekbar").addEventListener('click', e=>{
        var max=e.target.getBoundingClientRect().width;
        percent=(e.offsetX/max)*100-1;
        document.querySelector('.circle').style.left=(e.offsetX/max)*100-0.8+"%";
        audio.currentTime=audio.duration*(percent/100);
    })

    // hamburger event listner
    document.querySelector(".hamburger").addEventListener('click', ()=>{
        document.querySelector('.left').style.left= 0 +"%";
    })

    // close hamburger
    document.querySelector(".close").addEventListener('click', ()=>{
        document.querySelector('.left').style.left=-110 +"%";
    })

    // volume changer
   document.querySelector(".volume").getElementsByTagName('input')[0].addEventListener("change",(e)=>{
    audio.volume=(e.target.value/100);
   })

    // mute unmute    
    volume.addEventListener("click",(e)=>{
        let input=document.querySelector(".volume").getElementsByTagName('input')[0];
        if (audio.volume){
            audio.volume=0;
            input.value=0;
            volume.src="../static/img/mute.svg";
        }
        else{
            volume.src="../static/img/volume.svg";
            input.value=10;
            audio.volume=input.value/100;
        }
    // document.querySelector()
   })
   
   setTimeout(function() {
    let flashes = document.querySelectorAll('.flashes li');
    flashes.forEach(function(flash) {
        flash.style.display = 'none';
    });
}, 2000); // 2000 milliseconds = 2 seconds
      
}

main()