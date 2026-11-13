// One recording per Part; book/test numbers match the original source book.
let listeningAudioKey = '', listeningAudioObjectURL = '', listeningAudioSeek = 0;
const listeningAudioPositions = new Map();

function listeningAudioPath() {
  return `data/audios/c${current.book}/test${current.sourceTest}/part${part}.mp3`;
}

function syncListeningAudio() {
  const key = `${current.id}:${part}`;
  if (key === listeningAudioKey) return;
  const audio = document.getElementById('listening-audio');
  if (listeningAudioKey) listeningAudioPositions.set(listeningAudioKey, audio.currentTime || 0);
  audio.pause();
  if (listeningAudioObjectURL) URL.revokeObjectURL(listeningAudioObjectURL);
  listeningAudioObjectURL = '';
  listeningAudioKey = key;
  listeningAudioSeek = listeningAudioPositions.get(key) || 0;
  document.getElementById('listening-audio-file').value = '';
  const path = listeningAudioPath();
  audio.src = path;
  audio.load();
  audio.playbackRate = Number(document.getElementById('listening-audio-speed').value);
  document.getElementById('listening-audio-label').textContent = `Cambridge ${current.book} · Test ${current.sourceTest} · Part ${part}`;
  document.getElementById('listening-audio-status').textContent = 'Đang tải audio…';
}

function setupListeningAudio() {
  const audio = document.getElementById('listening-audio');
  const status = document.getElementById('listening-audio-status');
  audio.addEventListener('loadedmetadata', () => {
    audio.currentTime = Number.isFinite(audio.duration) ? Math.min(listeningAudioSeek, Math.max(0, audio.duration - 0.1)) : 0;
    audio.playbackRate = Number(document.getElementById('listening-audio-speed').value);
    status.textContent = 'Sẵn sàng · Bấm Play để bắt đầu';
  });
  audio.addEventListener('error', () => {
    status.textContent = 'Chưa có audio cho phần này. Bạn có thể chọn file từ máy để nghe.';
  });
  audio.addEventListener('timeupdate', () => {
    listeningAudioPositions.set(listeningAudioKey, audio.currentTime || 0);
  });
  audio.addEventListener('ended', () => {
    listeningAudioPositions.set(listeningAudioKey, 0);
    status.textContent = 'Đã nghe hết Part này. Chọn Part tiếp theo hoặc nghe lại.';
  });
  document.getElementById('listening-audio-speed').onchange = e => {
    audio.playbackRate = Number(e.target.value);
  };
  document.getElementById('listening-audio-replay').onclick = () => {
    listeningAudioSeek = 0;
    if (audio.readyState < 1) return;
    audio.currentTime = 0;
    audio.play().catch(() => { status.textContent = 'Bấm Play trên trình phát để nghe audio.'; });
  };
  for (const button of document.querySelectorAll('[data-audio-skip]')) {
    button.onclick = () => {
      if (audio.readyState < 1 || !Number.isFinite(audio.duration)) return;
      audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + Number(button.dataset.audioSkip)));
    };
  }
  document.getElementById('listening-audio-file').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    audio.pause();
    if (listeningAudioObjectURL) URL.revokeObjectURL(listeningAudioObjectURL);
    listeningAudioObjectURL = URL.createObjectURL(file);
    listeningAudioSeek = 0;
    listeningAudioPositions.set(listeningAudioKey, 0);
    audio.src = listeningAudioObjectURL;
    audio.load();
    status.textContent = `Audio cục bộ: ${file.name} · chỉ dùng cho Part hiện tại`;
  };
  window.addEventListener('pagehide', () => audio.pause());
}

setupListeningAudio();
