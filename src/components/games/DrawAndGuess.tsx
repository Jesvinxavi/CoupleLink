import { useEffect, useRef, useState } from 'react';
import CanvasDraw from 'react-canvas-draw';
import { supabase } from '../../lib/supabase';
import { useCoupleData } from '../../hooks/useCoupleData';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Eraser, Undo } from 'lucide-react';

export function DrawAndGuess() {
    const { couple } = useCoupleData();
    const canvasRef = useRef<any>(null);
    const [brushColor, setBrushColor] = useState("#000000");
    const [brushRadius, setBrushRadius] = useState(4);

    useEffect(() => {
        if (!couple) return;

        const channel = supabase.channel(`game_room:${couple.id}`)
            .on('broadcast', { event: 'draw' }, (payload) => {
                if (canvasRef.current && payload.payload.data) {
                    canvasRef.current.loadSaveData(payload.payload.data, true);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [couple]);

    const handleDraw = () => {
        if (!couple || !canvasRef.current) return;

        // Debounce or throttle this in a real app to avoid flooding
        const data = canvasRef.current.getSaveData();

        supabase.channel(`game_room:${couple.id}`).send({
            type: 'broadcast',
            event: 'draw',
            payload: { data }
        });
    };

    const clearCanvas = () => {
        if (canvasRef.current) {
            canvasRef.current.clear();
            handleDraw(); // Sync clear
        }
    };

    const undo = () => {
        if (canvasRef.current) {
            canvasRef.current.undo();
            handleDraw(); // Sync undo
        }
    };

    const colors = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"];

    return (
        <div className="space-y-4">
            <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0 relative bg-white">
                    <CanvasDraw
                        ref={canvasRef}
                        brushColor={brushColor}
                        brushRadius={brushRadius}
                        lazyRadius={0}
                        canvasWidth={window.innerWidth > 600 ? 600 : window.innerWidth - 64}
                        canvasHeight={400}
                        onChange={handleDraw}
                        className="touch-none mx-auto"
                    />
                </CardContent>
            </Card>

            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                        {colors.map(c => (
                            <button
                                key={c}
                                className={`w-8 h-8 rounded-full border-2 ${brushColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                                onClick={() => setBrushColor(c)}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Simple radius toggle for now if Slider isn't ready */}
                        <Button variant="outline" size="icon" onClick={() => setBrushRadius(Math.max(2, brushRadius - 2))}>-</Button>
                        <span className="text-xs w-4 text-center">{brushRadius}</span>
                        <Button variant="outline" size="icon" onClick={() => setBrushRadius(Math.min(20, brushRadius + 2))}>+</Button>
                    </div>
                </div>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={undo} className="gap-2">
                        <Undo className="w-4 h-4" /> Undo
                    </Button>
                    <Button variant="destructive" onClick={clearCanvas} className="gap-2">
                        <Eraser className="w-4 h-4" /> Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}
