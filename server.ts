import * as alt from 'alt-server';

// Obsługa włączenia/wyłączenia trybu reżysera
alt.onClient('toggleDirectorMode', (player) => {
    alt.emitClient(player, 'toggleDirectorMode');
});
