const WebSocket = require('ws');
const wss = new WebSocket.Server( { port: process.env.PORT || 3000 } );
const Jimp = require('jimp');
const colors = [
    '000000', '800000', '008000', '808000',
    '000080', '800080', '008080', 'c0c0c0',
    '808080', 'ff0000', '00ff00', 'ffff00',
    '0000ff', 'ff00ff', '00ffff', 'ffffff'
];
let width;
function sendNumberOfUsers() {
    wss.clients.forEach(ws => {
        ws.send(JSON.stringify({
            msgType: 'user',
            number: wss.clients.size
        }));
    });
};
wss.on('connection', async ws => {
    let numberOfSameIps = 0;
    for (const client of wss.clients) {
        if (client._socket.remoteAddress === ws._socket.remoteAddress) {
            numberOfSameIps++;
            if (numberOfSameIps > 1) {
                ws.close();
                return;
            };
        };
    };
    const img = await Jimp.read('canvas.png');
    const bitmap = img.bitmap;
    width = bitmap.width;
    ws.send(JSON.stringify({
        msgType: 'canvas',
        width: width,
        colors: colors,
        buffer: bitmap.data
    }));
    ws.on('message', e => {
        const data = JSON.parse(e);
        const x = data.x;
        const y = data.y;
        const color = data.color;
        if (Number.isInteger(x)
         && Number.isInteger(y) 
         && 0 <= x < width
         && 0 <= y < width
         && colors.find(element => element === color)
        ) {
            const hex = parseInt(`${color}ff`, 16);
            img.setPixelColor(hex, x, y);
            img.write('canvas.png');
            wss.clients.forEach(ws => {
                ws.send(JSON.stringify({
                    msgType: 'pixel',
                    x: x,
                    y: y,
                    color: Jimp.intToRGBA(hex)
                }));
            });
        };
    });
    sendNumberOfUsers();
    ws.on('close', () => sendNumberOfUsers() );
});
