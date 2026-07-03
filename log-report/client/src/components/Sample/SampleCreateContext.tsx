import React, { createContext, useState, useContext } from 'react';

const ColorContext = createContext({
    color: 'blue',
    setToRed: () => { },
    setToBlue: () => { }
})

export const ColorProvider = ({ children }: { children: React.ReactNode }) => {
    const [color, setColor] = useState('blue');

    const setToRed = () => setColor('red');
    const setToBlue = () => setColor('blue');

    return (
        <ColorContext.Provider value={{ color, setToRed, setToBlue }}>
            {children}
        </ColorContext.Provider >
    );
}

export const useColor = () => useContext(ColorContext);

export const Sample = (): any => {
    const { color, setToRed, setToBlue } = useColor();

    return (
        <div>
            <h1 style={{ color: color }}>This text changes color</h1>
            <button onClick={setToRed}>Make Red</button>
            <br />
            <button onClick={setToBlue}>Make Blue</button>
        </div>
    )
}
