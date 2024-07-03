let audio = new Audio();
let songslist;
let lastsearch;
let library = [];  

async function fetchLibraryData(filename) {
    try {
        const response = await fetch(`${filename}`);  // Fetch the JSON file
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const json = await response.json();  // Parse the JSON from the response
        library = json;  // Update the global variable `library`
        } catch (error) {
        console.error('Error fetching library data:', error);
    }
}

async function getsongs(songs){
    let list=[]

    for(let i=0; i< songs.length;i++){  
        const searchTerm = `${songs[i].title} ${songs[i].artist}`;
        var url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=1`;
        try{
            const response = await fetch(url, {
                credentials: 'omit' // Ensure no cookies are sent with the request
            });

            let data=await response.json();

            if (data.results.length>0){
                const result=data.results[0];
                song={
                    result : data.results[0],
                    index : i,
                    artistName : result.artistName,
                    trackName : result.trackName,
                    albumName : result.collectionName,
                    artworkUrl : result.artworkUrl100,
                    audioUrl : result.previewUrl,
                    explicit : result.trackExplicitness,
                    duration: result.trackTimeMillis/60000
                }
                list.push(song);
                
            }
            else{
                console.log(`No results found for ${searchTerm}`);
            }
        }
        catch(error){
            console.error("error fetching songs",error);
        }
    }
    return list;
}

const playmusic = (songTitle,songsList,pause=false) => {
    playButton.src="img/play.svg";
    const song = songsList.find(s => s.trackName.toLowerCase() === songTitle.toLowerCase());
    if (song) { 
        if (audio) {
            audio.pause();
        }
        audio.src = song.audioUrl;
        if (!pause){
            audio.play()
            playButton.src="img/pause.svg"
        }   
        document.querySelector('.songinfo').innerHTML=song.trackName;
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
        songUL.innerHTML=songUL.innerHTML+`<li> <img src="${song.artworkUrl}" alt=""> <div class="info"><div class="trackname">${song.trackName}</div> <div class="artist">${song.artistName}</div></div> <div class="playnow"><img src="img/playnow.svg" alt=""> </div></li>`;
    }

    // play songs directly
    Array.from(document.querySelector('.songlist').getElementsByTagName('li')).forEach(e=>{
        e.addEventListener('mouseenter', () => {
            e.getElementsByTagName('img')[1].src = "img/playnow_highlighted.svg";  // Access the first <img> element within `e`
        });
        
        e.addEventListener('mouseleave', () => {
            e.getElementsByTagName('img')[1].src = "img/playnow.svg";  // Access the first <img> element within `e`
        });

        e.addEventListener('click', () => {
            playmusic(e.querySelector('.info').firstChild.innerHTML,songslist);
        })
    })
}

async function displayAlbums(folder,index){
    document.getElementsByClassName('spotifyPlaylist')[index].getElementsByTagName('h1')[0].innerHTML=`${folder}`;
    let a= await fetch(`/songs/${folder}`) 
    let response=await a.text();
    let div=document.createElement('div');
    div.innerHTML=response;
    let anchors=div.getElementsByTagName('a');
    let array1 =Array.from(anchors);
    for (let i=0;i<array1.length; i++){
        const e=array1[i];
        if (e.href.includes(`/songs/${folder}/`)){
            // console.log((e.href.split('/').slice(-1))[0]);
            // let folder1=(e.href.split('/').slice(-2))[0];
            let folder1=(e.href.split('/').slice(-1))[0];
            console.log(folder1);

            if (!folder1.includes('.json')){
                let a= await fetch(`/songs/${folder}/${folder1}/info.json`);
                let response= await a.json();
                
                // console.log(i);
                let cardContainer=document.getElementsByClassName('cardContainer')[index];
                // console.log(cardContainer);
                cardContainer.innerHTML+=`<div data-file=${response.datafile} class="card">
                <div class="play">
                    <img src="img/albums-play.svg" alt="play" />
                </div>

                <img
                    src=${response.albumCover}
                    alt=""
                />
                <h1>${response.title}</h1>
                <p>${response.description}</p>
                </div>`;
            }
        }
    }   
    // update library based on playlist 
    Array.from(document.getElementsByClassName('cardContainer')[index].getElementsByClassName('card')).forEach(e=>{
        e.addEventListener('click', async item=>{
            backward=current;
            current="album";
            console.log(folder);
            await fetchLibraryData(`/songs/${folder}/${item.currentTarget.dataset.file}/${item.currentTarget.dataset.file}.json`);
            songslist= await getsongs(library);
            playmusic(songslist[0].trackName,songslist);
            update_library(songslist);
        })
    });
}

async function display(){
    list=["SpotifyPlaylists","YourArtistMixes","YourDecadeMixes"]
    for (let i =0;i<list.length;i++){
        await displayAlbums(list[i],i);
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
                        index : i,
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
    await fetchLibraryData("/songs/library.json");
    songslist= await getsongs(library);
    playmusic(songslist[0].trackName,songslist,true);
    update_library(songslist);
    document.querySelector('.searchBar').style.display="none";
    document.querySelector('.searchButton a').style.display = 'block';
    document.querySelector('.library h2').innerHTML="Your Library";
    search.style.display = 'flex';
}

let current='home';
let backward='home';
let forward='home';


async function main(){ 
   
    // gets the list of songs that is present on top we can update the list later when we give the user option to add songs to his library
    await fetchLibraryData("/songs/library.json");
    songslist= await getsongs(library);
    playmusic(songslist[0].trackName,songslist,true);
    
    update_library(songslist);
    display();

    // search
    document.querySelector('.searchButton').addEventListener('click',()=>{
        document.querySelector('.searchBar').style.display="flex";
        document.querySelector('.searchButton a').style.display = 'none';
        search.style.display = 'none';
    })
    document.getElementById('search-button').addEventListener('click',()=>{
        backward=current;
        const searchInput = document.getElementById('search-bar');
        current=`${searchInput.value}`;
        lastsearch=searchInput.value;
        document.querySelector('.library h2').innerHTML="Search Results";
        searchSongs(searchInput.value);
    })
    document.querySelector('.homeButton').addEventListener('click', async ()=>{
        home();
    })

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
    })

    // playbar
    playButton.addEventListener('click', () => {
        if (audio.src){
            if (audio.paused){
                audio.play()
                playButton.src="img/pause.svg";
                console.log("Playing audio");
            }
            else{
                if (audio && !audio.paused) {
                    playButton.src="img/play.svg";
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
            playButton.src="img/play.svg";
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
            volume.src="img/mute.svg";
        }
        else{
            volume.src="img/volume.svg";
            input.value=10;
            audio.volume=input.value/100;
        }
    // document.querySelector()
   })
   
    
      
}

main()