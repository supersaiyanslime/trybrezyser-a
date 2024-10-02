import * as alt from 'alt-client';
import * as native from 'natives';

let directorMode = false; // Czy użytkownik jest w trybie reżysera
let savePoints: Array<{ position: alt.Vector3, rotation: alt.Vector3 }> = []; // Lista zapisanych punktów
let currentMoveIndex = 0; // Aktualny punkt, do którego kamera się porusza
let isMoving = false; // Czy kamera się porusza

// Przełączanie trybu reżysera
alt.on('keydown', (key) => {
    if (key === 'F6'.charCodeAt(0)) {
        alt.emitServer('toggleDirectorMode'); // Informacja do serwera, by przełączyć tryb
    }
});

// Odbieranie informacji o przełączeniu trybu reżysera z serwera
alt.on('toggleDirectorMode', () => {
    directorMode = !directorMode;
    alt.log(`Tryb reżysera: ${directorMode ? 'Włączony' : 'Wyłączony'}`);
});

// Zapis pozycji i rotacji kamery (guzik H)
alt.on('keydown', (key) => {
    if (directorMode && key === 'H'.charCodeAt(0)) {
        if (savePoints.length < 10) {
            const position = alt.Player.local.pos; // Pozycja gracza
            const rotation = native.getGameplayCamRot(2); // Rotacja kamery

            savePoints.push({ position, rotation });
            alt.log(`Zapisano punkt kamery (${savePoints.length}): ${JSON.stringify(position)}, ${JSON.stringify(rotation)}`);
        } else {
            alt.log('Osiągnięto maksymalną liczbę punktów (10).');
        }
    }
});

// Ruch kamery (guzik O)
alt.on('keydown', (key) => {
    if (directorMode && key === 'O'.charCodeAt(0) && savePoints.length > 1 && !isMoving) {
        alt.log('Rozpoczynanie płynnego ruchu kamery.');
        currentMoveIndex = 0;
        moveToNextPoint();
    }
});

// Funkcja płynnego ruchu kamery między zapisanymi punktami
function moveToNextPoint() {
    if (currentMoveIndex >= savePoints.length - 1) {
        alt.log('Zakończono ruch kamery.');
        isMoving = false;
        return;
    }

    isMoving = true;

    const startPoint = savePoints[currentMoveIndex];
    const endPoint = savePoints[currentMoveIndex + 1];
    const moveDuration = 3000; // Czas ruchu między punktami (3 sekundy)
    const startTime = Date.now();

    const interval = alt.everyTick(() => {
        const elapsedTime = Date.now() - startTime;
        const t = Math.min(elapsedTime / moveDuration, 1); // Procentowy postęp (od 0 do 1)

        // Interpolacja pozycji i rotacji
        const currentPosition = interpolateVector(startPoint.position, endPoint.position, t);
        const currentRotation = interpolateVector(startPoint.rotation, endPoint.rotation, t);

        // Ustawienie kamery
        native.setCamCoord(native.getRenderingCam(), currentPosition.x, currentPosition.y, currentPosition.z);
        native.setCamRot(native.getRenderingCam(), currentRotation.x, currentRotation.y, currentRotation.z, 2);

        // Sprawdzenie, czy zakończono ruch do kolejnego punktu
        if (t === 1) {
            alt.clearEveryTick(interval);
            currentMoveIndex++;
            moveToNextPoint();
        }
    });
}

// Interpolacja między dwoma wektorami (pozycja i rotacja)
function interpolateVector(start: alt.Vector3, end: alt.Vector3, t: number): alt.Vector3 {
    return new alt.Vector3(
        start.x + (end.x - start.x) * t,
        start.y + (end.y - start.y) * t,
        start.z + (end.z - start.z) * t
    );
}
