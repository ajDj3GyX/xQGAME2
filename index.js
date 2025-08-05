const ABLY_API_KEY = 'nc5NGw.wSmsXg:SMs5pD5aJ4hGMvNZnd7pJp2lYS2X1iCmWm_yeLx_pkk';
const realtime = new Ably.Realtime(ABLY_API_KEY);

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `mt-6 p-4 rounded-lg text-center font-medium ${type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} animate-pulse scale-in`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

function generateRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

document.addEventListener('DOMContentLoaded', () => {
    // 添加输入框动画效果
    const roomInput = document.getElementById('roomCode');
    roomInput.addEventListener('focus', () => {
        roomInput.classList.add('ring-2', 'ring-blue-400', 'scale-105');
    });
    roomInput.addEventListener('blur', () => {
        roomInput.classList.remove('ring-2', 'ring-blue-400', 'scale-105');
    });
    
    // 创建房间按钮
    document.getElementById('createRoom').addEventListener('click', () => {
        const roomCode = generateRoomCode();
        
        // 存储房间信息
        localStorage.setItem('currentRoom', roomCode);
        localStorage.setItem('playerColor', 'red');
        
        showNotification(`房间创建成功！房间码: ${roomCode}`, 'success');
        
        // 添加创建动画
        const createBtn = document.getElementById('createRoom');
        createBtn.classList.add('pulse');
        setTimeout(() => {
            createBtn.classList.remove('pulse');
        }, 1000);
        
        // 跳转至游戏页面
        setTimeout(() => {
            window.location.href = `game.html?room=${encodeURIComponent(roomCode)}`;
        }, 1500);
    });

    // 加入房间按钮
    document.getElementById('joinRoom').addEventListener('click', () => {
        const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
        
        if (!roomCode) {
            showNotification('请输入房间码', 'error');
            return;
        }
        
        if (!/^[A-Z0-9]{6}$/.test(roomCode)) {
            showNotification('请输入有效的6位房间码', 'error');
            return;
        }
        
        // 存储房间信息
        localStorage.setItem('currentRoom', roomCode);
        localStorage.setItem('playerColor', 'black');
        
        showNotification('正在加入房间...', 'success');
        
        // 添加加入动画
        const joinBtn = document.getElementById('joinRoom');
        joinBtn.classList.add('pulse');
        setTimeout(() => {
            joinBtn.classList.remove('pulse');
        }, 1000);
        
        // 跳转至游戏页面
        setTimeout(() => {
            window.location.href = `game.html?room=${encodeURIComponent(roomCode)}`;
        }, 1000);
    });
    
    // 允许按Enter键加入房间
    document.getElementById('roomCode').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('joinRoom').click();
        }
    });
    
    // 自动转换输入为大写
    document.getElementById('roomCode').addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase();
    });
});