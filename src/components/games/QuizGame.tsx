import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Lock, Unlock } from 'lucide-react';

interface QuizGameProps {
    title: string;
    question: string;
    options?: string[];
    onAnswer: (answer: string) => void;
    myAnswer?: string;
    partnerAnswer?: string;
}

export function QuizGame({ title, question, options, onAnswer, myAnswer, partnerAnswer }: QuizGameProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const handleSubmit = () => {
        if (selectedOption) {
            onAnswer(selectedOption);
        }
    };

    const isRevealed = !!myAnswer && !!partnerAnswer;

    return (
        <Card className="w-full max-w-md mx-auto border-none shadow-md bg-white overflow-hidden">
            <CardHeader className="bg-rose-50 border-b border-rose-100 pb-4">
                <CardTitle className="text-center text-rose-600 uppercase tracking-wide text-sm font-bold">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <h2 className="text-xl font-bold text-center text-gray-900">{question}</h2>

                {/* Options / Input Area */}
                {!myAnswer ? (
                    <div className="space-y-3">
                        {options ? (
                            options.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setSelectedOption(option)}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${selectedOption === option
                                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                                        : 'border-gray-200 hover:border-rose-200'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))
                        ) : (
                            <textarea
                                className="w-full p-3 border rounded-xl"
                                placeholder="Type your answer..."
                                onChange={(e) => setSelectedOption(e.target.value)}
                            />
                        )}
                        <Button
                            className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl h-12 text-lg font-medium mt-4"
                            disabled={!selectedOption}
                            onClick={handleSubmit}
                        >
                            Lock Answer
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* My Answer */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">You Answered</p>
                            <p className="text-lg font-medium text-gray-900">{myAnswer}</p>
                        </div>

                        {/* Partner Answer */}
                        <div className={`p-4 rounded-xl border transition-all ${isRevealed ? 'bg-rose-50 border-rose-100' : 'bg-gray-100 border-gray-200'}`}>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Partner Answered</p>
                            {isRevealed ? (
                                <div className="flex items-start gap-2">
                                    <Unlock className="w-5 h-5 text-rose-500 mt-0.5" />
                                    <p className="text-lg font-medium text-gray-900">{partnerAnswer}</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-4 text-gray-400 gap-2">
                                    <Lock className="w-5 h-5" />
                                    <span className="text-sm font-medium">
                                        {partnerAnswer ? 'Locked until you answer' : 'Waiting for partner...'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
