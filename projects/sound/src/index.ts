

window.onload = () => {
    const context = new AudioContext();
    const gain = context.createGain();
    gain.connect(context.destination);
    
    const numVolume = document.querySelector<HTMLInputElement>("#numVolume")!;
    const lblVolume = document.querySelector("#lblVolume")!;
    gain.gain.value = Number(numVolume.value);

    lblVolume.textContent = `${Math.floor(Number(numVolume.value) * 100)}%`;
    numVolume.addEventListener("input", ()=>{
        let value = Number(numVolume.value);
        if(isNaN(value)) {
            console.error("Volume is not a number!");
            value = 0;
        }

        gain.gain.value = value;
        lblVolume.textContent = `${Math.floor(value * 100)}%`;
    });

    const selWaveType = document.querySelector<HTMLSelectElement>("#selWaveType")!;
    const numFrequency = document.querySelector("#frequency")!;
    numFrequency.addEventListener("click", (event)=>{
        const value = (event.target as HTMLElement).getAttribute("value");
        let frequency = Number(value);
        if(isNaN(frequency)){
            console.error(`${value} is not a number!`);
            return;
        }

        const node = context.createOscillator();
        node.type = selWaveType.value as OscillatorType;
        node.frequency.setValueAtTime(frequency, context.currentTime);
        node.connect(gain);
        node.start();
        window.setTimeout(()=>node.stop(), 500);
    });
}