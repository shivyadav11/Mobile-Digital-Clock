let darkTheme = false;
let isManualTheme = false; // manual theme toggle
let alarms = [];
const alarmAudio = document.getElementById("alarmAudio");

// Modal Elements
const alarmModal = document.getElementById("alarmModal");
const modalLabel = document.getElementById("modalLabel");
const modalTime = document.getElementById("modalTime");
const snoozeMinutesInput = document.getElementById("snoozeMinutes");
const dismissBtn = document.getElementById("dismissBtn");
const snoozeBtn = document.getElementById("snoozeBtn");
const stopBtn = document.getElementById("stopBtn");
const repeatBtn = document.getElementById("repeatBtn");

let currentAlarmIndex = null;
let snoozeTimeout = null; // for auto-stop snooze
let alarmInterval = null; // loop alarm every 30s

// Request Notification Permission
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission();
}

// Show notification
function showAlarmNotification(alarm) {
  if (Notification.permission === "granted") {
    const notification = new Notification("⏰ Alarm!", {
      body: `${alarm.label} at ${alarm.time}`,
      icon: "https://img.icons8.com/emoji/48/alarm-clock-emoji.png"
    });
    notification.onclick = () => window.focus();
  }
}

// Update Clock Every Second
function updateClock() {
  const now = new Date();

  let hours = now.getHours();
  let minutes = now.getMinutes();
  let seconds = now.getSeconds();
  let ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  document.getElementById("hours").textContent = hours < 10 ? "0"+hours : hours;
  document.getElementById("minutes").textContent = minutes < 10 ? "0"+minutes : minutes;
  document.getElementById("seconds").textContent = seconds < 10 ? "0"+seconds : seconds;
  document.getElementById("ampm").textContent = ampm;

  document.getElementById("secondsProgress").style.width = (seconds/60)*100 + "%";

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  document.getElementById("dayDate").textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  // Only update dynamic background if manual theme not toggled
  if(!isManualTheme){
    const currentHour = now.getHours();
    if(currentHour >= 6 && currentHour < 12){
      document.body.style.background = "linear-gradient(to right, #FFDEE9, #B5FFFC)";
      document.body.style.color = "#000";
    } else if(currentHour >= 12 && currentHour < 16){
      document.body.style.background = "linear-gradient(to right, #fbc2eb, #a6c1ee)";
      document.body.style.color = "#000";
    } else if(currentHour >=16 && currentHour < 19){
      document.body.style.background = "linear-gradient(to right, #f857a6, #ff5858)";
      document.body.style.color = "#fff";
    } else {
      document.body.style.background = "linear-gradient(to right, #232526, #414345)";
      document.body.style.color = "#fff";
    }
  }

  // Check alarms
  alarms.forEach((alarm, index)=>{
    if(alarm.hours === now.getHours() && alarm.minutes === now.getMinutes() && seconds === 0){
      showAlarmModal(alarm, index);
    }
  });
}

// Render alarms
function renderAlarms(){
  const list = document.getElementById("alarmList");
  list.innerHTML = "";
  alarms.forEach((alarm,index)=>{
    const li = document.createElement("li");
    li.textContent = `${alarm.time} - ${alarm.label}`;
    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click",()=>{
      alarms.splice(index,1);
      renderAlarms();
    });
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

// Add new alarm with optional file upload
document.getElementById("setAlarmBtn").addEventListener("click", ()=>{
  const timeInput = document.getElementById("alarmTime").value;
  const labelInput = document.getElementById("alarmLabel").value || "Alarm";
  const fileInput = document.getElementById("alarmFile").files[0];

  if(timeInput){
    const [hours, minutes] = timeInput.split(":").map(Number);
    let soundURL = "https://www.soundjay.com/buttons/sounds/beep-07.mp3"; // default
    if(fileInput){
      soundURL = URL.createObjectURL(fileInput); // local file
    }

    alarms.push({hours, minutes, label: labelInput, time: timeInput, sound: soundURL});
    renderAlarms();

    document.getElementById("alarmTime").value = "";
    document.getElementById("alarmLabel").value = "";
    document.getElementById("alarmFile").value = "";
  }
});

// Theme toggle button with image background
document.getElementById("themeBtn").addEventListener("click", ()=>{
  darkTheme = !darkTheme;
  isManualTheme = true;

  if(darkTheme){
    document.body.style.backgroundImage = "url('generated-image (19).png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.color = "#fff";
    document.getElementById("themeBtn").textContent = "Switch to Bright Theme";
  } else {
    document.body.style.backgroundImage = "url('generated-image (20).png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.color = "#000";
    document.getElementById("themeBtn").textContent = "Switch to Dark Theme";
  }
});

// Show alarm modal
function showAlarmModal(alarm,index){
  currentAlarmIndex = index;

  alarmAudio.src = alarm.sound;
  alarmAudio.currentTime = 0;
  alarmAudio.play();

  // repeat alarm every 30 seconds until dismissed
  if (alarmInterval) clearInterval(alarmInterval);
  alarmInterval = setInterval(() => {
    alarmAudio.currentTime = 0;
    alarmAudio.play();
  }, 30000);

  modalLabel.textContent = alarm.label;
  modalTime.textContent = `⏰ ${alarm.time}`;
  alarmModal.classList.add("flash");
  alarmModal.style.display = "flex";

  if(Notification.permission === "granted"){
    new Notification("⏰ Alarm!", { body: `${alarm.label} at ${alarm.time}` });
  }
}

// Close modal
function closeAlarmModal(){
  alarmModal.style.display = "none";
  alarmModal.classList.remove("flash");
  alarmAudio.pause();
  alarmAudio.currentTime = 0;

  if (alarmInterval) clearInterval(alarmInterval); // stop repeat
  alarmInterval = null;

  if(snoozeTimeout) clearTimeout(snoozeTimeout);
}

// Modal buttons
dismissBtn.addEventListener("click", ()=>{
  alarms.splice(currentAlarmIndex,1);
  renderAlarms();
  closeAlarmModal();
});

snoozeBtn.addEventListener("click", ()=>{
  let snoozeMinutes = parseInt(snoozeMinutesInput.value) || 5;

  let snoozeTime = new Date();
  snoozeTime.setHours(alarms[currentAlarmIndex].hours);
  snoozeTime.setMinutes(alarms[currentAlarmIndex].minutes + snoozeMinutes);
  alarms[currentAlarmIndex].hours = snoozeTime.getHours();
  alarms[currentAlarmIndex].minutes = snoozeTime.getMinutes();
  renderAlarms();

  closeAlarmModal();
});

stopBtn.addEventListener("click", ()=>{
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
  if (alarmInterval) clearInterval(alarmInterval);
  alarmInterval = null;
  if(snoozeTimeout) clearTimeout(snoozeTimeout);
});

repeatBtn.addEventListener("click", ()=>{
  alarmAudio.currentTime = 0;
  alarmAudio.play();
  if(snoozeTimeout) clearTimeout(snoozeTimeout);
});

setInterval(updateClock,1000);
updateClock();

stopBtn.addEventListener("click", ()=>{
  alarmAudio.pause();
  alarmAudio.currentTime = 0;
  if(snoozeTimeout) clearTimeout(snoozeTimeout);
});

repeatBtn.addEventListener("click", ()=>{
  alarmAudio.currentTime = 0;
  alarmAudio.play();
  if(snoozeTimeout) clearTimeout(snoozeTimeout);
});

setInterval(updateClock,1000);
updateClock();
