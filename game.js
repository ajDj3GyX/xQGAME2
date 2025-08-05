const ABLY_API_KEY = 'nc5NGw.wSmsXg:SMs5pD5aJ4hGMvNZnd7pJp2lYS2X1iCmWm_yeLx_pkk';
const realtime = new Ably.Realtime(ABLY_API_KEY);

// 棋盘配置
const BOARD_SIZE = 9;
const BOARD_HEIGHT = 10;
const CHESS_SIZE = 60;

// 棋子类型
const PIECE_TYPES = {
    'GENERAL': '将',
    'ADVISOR': '士',
    'ELEPHANT': '象',
    'HORSE': '马',
    'CHARIOT': '车',
    'CANNON': '炮',
    'SOLDIER': '兵'
};

// 游戏状态
let currentRoom;
let playerColor;
let board;
let selectedPiece = null;
let moveHistory = [];
let isMyTurn = false;
let gameActive = false;
let channel;

// 初始化游戏
function initGame() {
    // 获取房间信息
    const urlParams = new URLSearchParams(window.location.search);
    currentRoom = urlParams.get('room') || localStorage.getItem('currentRoom');
    playerColor = localStorage.getItem('playerColor');
    
    if (!currentRoom) {
        window.location.href = 'index.html';
        return;
    }
    
    // 显示房间号和玩家颜色
    document.getElementById('roomCode').textContent = currentRoom;
    const colorDisplay = document.getElementById('playerColor');
    colorDisplay.textContent = playerColor === 'red' ? '红方' : '黑方';
    colorDisplay.className = playerColor === 'red' ? 'bg-gradient-to-r from-red-500 to-red-700' : 'bg-gradient-to-r from-gray-800 to-black';
    
    // 初始化棋盘
    board = createBoard();
    
    // 连接Ably通道
    channel = realtime.channels.get(currentRoom);
    channel.subscribe((msg) => handleMessage(msg));
    
    // 渲染棋盘
    renderBoard();
    
    // 添加按钮事件
    document.getElementById('undoBtn').addEventListener('click', requestUndo);
    document.getElementById('surrenderBtn').addEventListener('click', surrenderGame);
    
    // 如果是红方，立即开始游戏
    if (playerColor === 'red') {
        updateGameStatus('你是红方，请开始走棋');
        isMyTurn = true;
        gameActive = true;
        channel.publish('player_joined', { color: playerColor });
    } else {
        updateGameStatus('你是黑方，等待红方走棋...');
        channel.publish('player_joined', { color: playerColor });
    }
    
    // 更新按钮状态
    updateButtonStates();
}

// 创建初始棋盘
function createBoard() {
    const board = [];
    for (let i = 0; i < BOARD_HEIGHT; i++) {
        board[i] = new Array(BOARD_SIZE).fill(null);
    }
    
    // 初始化红方棋子
    board[0][0] = { type: 'CHARIOT', text: '车', color: 'red' };
    board[0][1] = { type: 'HORSE', text: '马', color: 'red' };
    board[0][2] = { type: 'ELEPHANT', text: '相', color: 'red' };
    board[0][3] = { type: 'ADVISOR', text: '士', color: 'red' };
    board[0][4] = { type: 'GENERAL', text: '帅', color: 'red' };
    board[0][5] = { type: 'ADVISOR', text: '士', color: 'red' };
    board[0][6] = { type: 'ELEPHANT', text: '相', color: 'red' };
    board[0][7] = { type: 'HORSE', text: '马', color: 'red' };
    board[0][8] = { type: 'CHARIOT', text: '车', color: 'red' };
    board[2][1] = { type: 'CANNON', text: '炮', color: 'red' };
    board[2][7] = { type: 'CANNON', text: '炮', color: 'red' };
    board[3][0] = { type: 'SOLDIER', text: '兵', color: 'red' };
    board[3][2] = { type: 'SOLDIER', text: '兵', color: 'red' };
    board[3][4] = { type: 'SOLDIER', text: '兵', color: 'red' };
    board[3][6] = { type: 'SOLDIER', text: '兵', color: 'red' };
    board[3][8] = { type: 'SOLDIER', text: '兵', color: 'red' };
    
    // 初始化黑方棋子
    board[9][0] = { type: 'CHARIOT', text: '车', color: 'black' };
    board[9][1] = { type: 'HORSE', text: '马', color: 'black' };
    board[9][2] = { type: 'ELEPHANT', text: '象', color: 'black' };
    board[9][3] = { type: 'ADVISOR', text: '士', color: 'black' };
    board[9][4] = { type: 'GENERAL', text: '将', color: 'black' };
    board[9][5] = { type: 'ADVISOR', text: '士', color: 'black' };
    board[9][6] = { type: 'ELEPHANT', text: '象', color: 'black' };
    board[9][7] = { type: 'HORSE', text: '马', color: 'black' };
    board[9][8] = { type: 'CHARIOT', text: '车', color: 'black' };
    board[7][1] = { type: 'CANNON', text: '炮', color: 'black' };
    board[7][7] = { type: 'CANNON', text: '炮', color: 'black' };
    board[6][0] = { type: 'SOLDIER', text: '卒', color: 'black' };
    board[6][2] = { type: 'SOLDIER', text: '卒', color: 'black' };
    board[6][4] = { type: 'SOLDIER', text: '卒', color: 'black' };
    board[6][6] = { type: 'SOLDIER', text: '卒', color: 'black' };
    board[6][8] = { type: 'SOLDIER', text: '卒', color: 'black' };
    
    return board;
}

// 渲染棋盘
function renderBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = board[y][x];
            const cell = document.createElement('div');
            cell.className = `cell ${(x + y) % 2 === 0 ? 'light' : 'dark'} relative`;
            cell.style.width = `${CHESS_SIZE}px`;
            cell.style.height = `${CHESS_SIZE}px`;
            cell.dataset.x = x;
            cell.dataset.y = y;
            cell.addEventListener('click', () => handleCellClick(x, y));
            
            // 添加楚河汉界文字
            if (y === 4 && (x === 0 || x === 8)) {
                const riverText = document.createElement('div');
                riverText.className = 'absolute inset-0 flex items-center justify-center text-gray-700 font-bold opacity-30 pointer-events-none';
                riverText.textContent = '楚';
                cell.appendChild(riverText);
            } else if (y === 5 && (x === 0 || x === 8)) {
                const riverText = document.createElement('div');
                riverText.className = 'absolute inset-0 flex items-center justify-center text-gray-700 font-bold opacity-30 pointer-events-none';
                riverText.textContent = '河';
                cell.appendChild(riverText);
            } else if (y === 4 && (x === 1 || x === 7)) {
                const riverText = document.createElement('div');
                riverText.className = 'absolute inset-0 flex items-center justify-center text-gray-700 font-bold opacity-30 pointer-events-none';
                riverText.textContent = '汉';
                cell.appendChild(riverText);
            } else if (y === 5 && (x === 1 || x === 7)) {
                const riverText = document.createElement('div');
                riverText.className = 'absolute inset-0 flex items-center justify-center text-gray-700 font-bold opacity-30 pointer-events-none';
                riverText.textContent = '界';
                cell.appendChild(riverText);
            }
            
            if (piece) {
                const chessPiece = document.createElement('div');
                chessPiece.className = `chess ${piece.color} ${isMyTurn && piece.color === playerColor ? 'cursor-pointer hover:ring-2 hover:ring-yellow-400' : ''}`;
                chessPiece.textContent = piece.text;
                chessPiece.style.lineHeight = `${CHESS_SIZE}px`;
                cell.appendChild(chessPiece);
            }
            
            chessboard.appendChild(cell);
        }
    }
    
    // 添加棋盘上的标记（九宫格）
    addBoardMarkers();
}

// 添加棋盘标记（九宫格）
function addBoardMarkers() {
    // 红方九宫格
    for (let y = 7; y <= 9; y++) {
        for (let x = 3; x <= 5; x++) {
            if ((y === 7 && (x === 3 || x === 5)) || 
                (y === 9 && (x === 3 || x === 5)) || 
                (x === 4 && y === 8)) {
                const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                if (cell) {
                    const marker = document.createElement('div');
                    marker.className = 'absolute w-1 h-1 bg-gray-700 rounded-full';
                    marker.style.top = '50%';
                    marker.style.left = '50%';
                    marker.style.transform = 'translate(-50%, -50%)';
                    cell.appendChild(marker);
                }
            }
        }
    }
    
    // 黑方九宫格
    for (let y = 0; y <= 2; y++) {
        for (let x = 3; x <= 5; x++) {
            if ((y === 0 && (x === 3 || x === 5)) || 
                (y === 2 && (x === 3 || x === 5)) || 
                (x === 4 && y === 1)) {
                const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
                if (cell) {
                    const marker = document.createElement('div');
                    marker.className = 'absolute w-1 h-1 bg-gray-700 rounded-full';
                    marker.style.top = '50%';
                    marker.style.left = '50%';
                    marker.style.transform = 'translate(-50%, -50%)';
                    cell.appendChild(marker);
                }
            }
        }
    }
}

// 处理单元格点击
function handleCellClick(x, y) {
    if (!gameActive || !isMyTurn) return;
    
    if (selectedPiece) {
        // 尝试移动棋子
        if (movePiece(selectedPiece.x, selectedPiece.y, x, y)) {
            // 发送移动消息给对手
            channel.publish('move', { 
                fromX: selectedPiece.x, 
                fromY: selectedPiece.y, 
                toX: x, 
                toY: y 
            });
            
            // 记录移动历史
            moveHistory.push({ 
                fromX: selectedPiece.x, 
                fromY: selectedPiece.y, 
                toX: x, 
                toY: y,
                piece: board[y][x],
                capturedPiece: board[y][x] ? board[y][x] : null
            });
            
            // 重置选择
            selectedPiece = null;
            isMyTurn = false;
            updateGameStatus('等待对手走棋...');
            renderBoard();
            updateButtonStates();
        }
    } else {
        // 选择棋子
        const piece = board[y][x];
        if (piece && piece.color === playerColor) {
            selectedPiece = { ...piece, x, y };
            highlightCell(x, y);
        }
    }
}

// 移动棋子
function movePiece(fromX, fromY, toX, toY) {
    const piece = board[fromY][fromX];
    
    // 检查目标位置是否合法
    if (!isValidMove(piece, fromX, fromY, toX, toY)) {
        return false;
    }
    
    // 执行移动
    board[toY][toX] = piece;
    board[fromY][fromX] = null;
    
    // 添加移动动画效果
    animateMove(fromX, fromY, toX, toY);
    
    // 检查是否将军或游戏结束
    setTimeout(() => {
        checkGameStatus();
    }, 300);
    
    return true;
}

// 添加移动动画
function animateMove(fromX, fromY, toX, toY) {
    const fromCell = document.querySelector(`.cell[data-x="${fromX}"][data-y="${fromY}"] .chess`);
    const toCell = document.querySelector(`.cell[data-x="${toX}"][data-y="${toY}"]`);
    
    if (fromCell) {
        fromCell.style.transition = 'all 0.3s ease';
        fromCell.style.transform = `translate(${(toX - fromX) * CHESS_SIZE}px, ${(toY - fromY) * CHESS_SIZE}px)`;
        
        setTimeout(() => {
            renderBoard();
        }, 300);
    }
}

// 检查移动是否合法
function isValidMove(piece, fromX, fromY, toX, toY) {
    // 基本边界检查
    if (toX < 0 || toX >= BOARD_SIZE || toY < 0 || toY >= BOARD_HEIGHT) {
        return false;
    }
    
    // 不能吃自己的棋子
    const targetPiece = board[toY][toX];
    if (targetPiece && targetPiece.color === piece.color) {
        return false;
    }
    
    // 根据棋子类型检查移动规则
    switch (piece.type) {
        case 'GENERAL':
            // 将/帅只能在九宫格内移动，每次只能移动一格
            if (piece.color === 'red') {
                if (toX < 3 || toX > 5 || toY < 7 || toY > 9) return false;
            } else {
                if (toX < 3 || toX > 5 || toY < 0 || toY > 2) return false;
            }
            return Math.abs(toX - fromX) + Math.abs(toY - fromY) === 1;
            
        case 'ADVISOR':
            // 士只能在九宫格内斜着走
            if (piece.color === 'red') {
                if (toX < 3 || toX > 5 || toY < 7 || toY > 9) return false;
            } else {
                if (toX < 3 || toX > 5 || toY < 0 || toY > 2) return false;
            }
            return Math.abs(toX - fromX) === 1 && Math.abs(toY - fromY) === 1;
            
        case 'ELEPHANT':
            // 象走田字，不能过河
            if (piece.color === 'red' && toY < 5) return false;
            if (piece.color === 'black' && toY > 4) return false;
            
            // 检查是否走田字
            if (Math.abs(toX - fromX) !== 2 || Math.abs(toY - fromY) !== 2) return false;
            
            // 检查象眼是否被堵
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            return !board[midY][midX];
            
        case 'HORSE':
            // 马走日字
            const dx = Math.abs(toX - fromX);
            const dy = Math.abs(toY - fromY);
            if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) return false;
            
            // 检查马脚是否被堵
            if (dx === 2) {
                const blockX = fromX + (toX - fromX) / 2;
                return !board[fromY][blockX];
            } else {
                const blockY = fromY + (toY - fromY) / 2;
                return !board[blockY][fromX];
            }
            
        case 'CHARIOT':
            // 车走直线
            if (fromX !== toX && fromY !== toY) return false;
            
            // 检查路径上是否有棋子
            if (fromX === toX) {
                const start = Math.min(fromY, toY);
                const end = Math.max(fromY, toY);
                for (let y = start + 1; y < end; y++) {
                    if (board[y][fromX]) return false;
                }
            } else {
                const start = Math.min(fromX, toX);
                const end = Math.max(fromX, toX);
                for (let x = start + 1; x < end; x++) {
                    if (board[fromY][x]) return false;
                }
            }
            return true;
            
        case 'CANNON':
            // 炮走直线
            if (fromX !== toX && fromY !== toY) return false;
            
            // 计算路径上的棋子数
            let pieceCount = 0;
            if (fromX === toX) {
                const start = Math.min(fromY, toY);
                const end = Math.max(fromY, toY);
                for (let y = start + 1; y < end; y++) {
                    if (board[y][fromX]) pieceCount++;
                }
            } else {
                const start = Math.min(fromX, toX);
                const end = Math.max(fromX, toX);
                for (let x = start + 1; x < end; x++) {
                    if (board[fromY][x]) pieceCount++;
                }
            }
            
            // 炮移动时路径必须为空，吃子时必须隔一个棋子
            if (targetPiece) {
                return pieceCount === 1;
            } else {
                return pieceCount === 0;
            }
            
        case 'SOLDIER':
            // 兵/卒只能前进，过河后可以左右移动
            if (piece.color === 'red') {
                // 红兵向上走
                if (toY > fromY) return false;
                
                // 过河前只能直走
                if (fromY > 4) {
                    return toX === fromX && toY === fromY - 1;
                } else {
                    // 过河后可以左右移动
                    return (toX === fromX && toY === fromY - 1) || 
                           (toY === fromY && Math.abs(toX - fromX) === 1);
                }
            } else {
                // 黑卒向下走
                if (toY < fromY) return false;
                
                // 过河前只能直走
                if (fromY < 5) {
                    return toX === fromX && toY === fromY + 1;
                } else {
                    // 过河后可以左右移动
                    return (toX === fromX && toY === fromY + 1) || 
                           (toY === fromY && Math.abs(toX - fromX) === 1);
                }
            }
            
        default:
            return false;
    }
}

// 高亮单元格
function highlightCell(x, y) {
    // 清除之前的高亮
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('ring-2', 'ring-blue-500');
    });
    
    // 高亮选中的单元格
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (cell) {
        cell.classList.add('ring-2', 'ring-blue-500');
    }
}

// 检查游戏状态
function checkGameStatus() {
    // 简化版：检查是否吃掉了对方的将/帅
    let redGeneral = false;
    let blackGeneral = false;
    
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const piece = board[y][x];
            if (piece && piece.type === 'GENERAL') {
                if (piece.color === 'red') redGeneral = true;
                if (piece.color === 'black') blackGeneral = true;
            }
        }
    }
    
    if (!redGeneral) {
        endGame('黑方获胜！');
    } else if (!blackGeneral) {
        endGame('红方获胜！');
    }
}

// 结束游戏
function endGame(message) {
    gameActive = false;
    updateGameStatus(message);
    
    // 显示结果对话框
    setTimeout(() => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50';
        resultDiv.innerHTML = `
            <div class="bg-white rounded-xl p-8 max-w-md text-center scale-in">
                <h2 class="text-3xl font-bold mb-4 text-gray-800">${message}</h2>
                <p class="text-lg mb-6 text-gray-600">游戏结束</p>
                <div class="flex justify-center space-x-4">
                    <button onclick="window.location.href='index.html'" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105">
                        返回首页
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 transform hover:scale-105">
                        关闭
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(resultDiv);
    }, 500);
}

// 更新游戏状态显示
function updateGameStatus(message) {
    const statusEl = document.getElementById('gameStatus');
    statusEl.textContent = message;
    
    // 根据消息类型添加样式
    if (message.includes('获胜')) {
        statusEl.className = 'bg-green-100 text-green-800 py-2 px-4 rounded-lg font-medium min-w-[200px] text-center pulse shadow-inner';
    } else if (message.includes('等待')) {
        statusEl.className = 'bg-blue-100 text-blue-800 py-2 px-4 rounded-lg font-medium min-w-[200px] text-center shadow-inner';
    } else if (message.includes('轮到你')) {
        statusEl.className = 'bg-yellow-100 text-yellow-800 py-2 px-4 rounded-lg font-medium min-w-[200px] text-center shadow-inner';
    } else {
        statusEl.className = 'bg-gray-100 text-gray-800 py-2 px-4 rounded-lg font-medium min-w-[200px] text-center shadow-inner';
    }
}

// 请求悔棋
function requestUndo() {
    if (moveHistory.length === 0) {
        updateGameStatus('没有可悔棋的步骤');
        return;
    }
    
    // 发送悔棋请求
    channel.publish('undo_request', { playerId: playerColor });
    updateGameStatus('已发送悔棋请求，等待对手回应...');
}

// 处理悔棋
function undoMove() {
    if (moveHistory.length === 0) return;
    
    // 获取最后一步移动
    const lastMove = moveHistory.pop();
    
    // 恢复棋子位置
    board[lastMove.fromY][lastMove.fromX] = lastMove.piece;
    board[lastMove.toY][lastMove.toX] = lastMove.capturedPiece;
    
    // 重新渲染棋盘
    renderBoard();
    
    // 切换回合
    isMyTurn = !isMyTurn;
    updateGameStatus(isMyTurn ? '轮到你走棋' : '等待对手走棋...');
    
    // 更新按钮状态
    updateButtonStates();
}

// 认输
function surrenderGame() {
    if (confirm('确定要认输吗？')) {
        channel.publish('surrender', { playerId: playerColor });
        endGame(playerColor === 'red' ? '黑方获胜！' : '红方获胜！');
    }
}

// 更新按钮状态
function updateButtonStates() {
    document.getElementById('undoBtn').disabled = moveHistory.length === 0 || !isMyTurn;
}

// 处理Ably消息
function handleMessage(msg) {
    switch (msg.name) {
        case 'player_joined':
            // 对手加入房间
            if (!gameActive) {
                gameActive = true;
                if (playerColor === 'red') {
                    isMyTurn = true;
                    updateGameStatus('轮到你走棋');
                } else {
                    isMyTurn = false;
                    updateGameStatus('等待红方走棋...');
                }
                updateButtonStates();
            }
            break;
            
        case 'move':
            // 处理对手的移动
            movePiece(msg.data.fromX, msg.data.fromY, msg.data.toX, msg.data.toY);
            isMyTurn = true;
            updateGameStatus('轮到你走棋');
            renderBoard();
            updateButtonStates();
            break;
            
        case 'undo_request':
            // 处理悔棋请求
            if (confirm('对手请求悔棋，是否同意？')) {
                undoMove();
                channel.publish('undo_confirm');
                updateGameStatus('你同意了悔棋请求');
            } else {
                channel.publish('undo_deny');
                updateGameStatus('你拒绝了悔棋请求');
            }
            break;
            
        case 'undo_confirm':
            // 对手同意悔棋
            undoMove();
            updateGameStatus('对手同意了悔棋请求');
            break;
            
        case 'undo_deny':
            // 对手拒绝悔棋
            updateGameStatus('对手拒绝了你的悔棋请求');
            break;
            
        case 'surrender':
            // 对手认输
            endGame(playerColor === 'red' ? '红方获胜！' : '黑方获胜！');
            break;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', initGame);