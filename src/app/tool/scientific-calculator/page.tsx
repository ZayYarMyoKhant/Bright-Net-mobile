
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const CalcButton = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
    <Button
        onClick={onClick}
        className={cn(
            "h-16 text-2xl font-semibold rounded-xl shadow-md active:shadow-inner active:scale-95 transition-all",
            className
        )}
        variant="outline"
    >
        {children}
    </Button>
);

export default function ScientificCalculatorPage() {
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [angleMode, setAngleMode] = useState<'DEG' | 'RAD'>('DEG');

    const handleInput = (value: string) => {
        if (display === '0' && value !== '.') {
            setDisplay(value);
            setExpression(value);
        } else if (display === 'Error') {
            setDisplay(value);
            setExpression(value);
        }
        else {
            setDisplay(prev => prev + value);
            setExpression(prev => prev + value);
        }
    };
    
    const handleOperator = (op: string) => {
        const lastChar = expression.slice(-1);
        if (['+', '-', '*', '/'].includes(lastChar)) {
             setExpression(prev => prev.slice(0, -1) + op);
        } else {
             setExpression(prev => prev + op);
        }
        setDisplay(op);
    }

    const calculate = () => {
        try {
            let evalExpression = expression
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/√\(/g, 'Math.sqrt(')
                .replace(/π/g, 'Math.PI')
                .replace(/e/g, 'Math.E');

            // Handle DEG/RAD for trig functions
            if (angleMode === 'DEG') {
                evalExpression = evalExpression.replace(/(Math\.sin|Math\.cos|Math\.tan)\(([^)]+)\)/g, (match, func, angle) => {
                    // This regex needs to be careful not to double-convert
                    // We can add a marker or check if it's already converted
                    // For simplicity here, we assume simple inputs. A robust calculator would need a proper parser.
                    return `${func}(${angle} * (Math.PI / 180))`;
                });
            }

            const result = new Function('return ' + evalExpression)();
            if (result === Infinity || isNaN(result)) {
                 throw new Error("Invalid calculation");
            }
            setDisplay(result.toString());
            setExpression(result.toString());
        } catch (error) {
            setDisplay('Error');
            setExpression('');
        }
    };
    
    const handleFunction = (func: string) => {
        const funcWithParen = `${func}(`;
         if (display === '0' || display === "Error") {
            setDisplay(funcWithParen);
            setExpression(funcWithParen);
        } else {
            // A more intelligent system would check if the last input was an operator
            setDisplay(prev => prev + funcWithParen);
            setExpression(prev => prev + funcWithParen);
        }
    }
    
    const handleClear = () => {
        setDisplay('0');
        setExpression('');
    };

    const handleBackspace = () => {
        if (display.length > 1) {
            setDisplay(prev => prev.slice(0, -1));
            setExpression(prev => prev.slice(0, -1));
        } else {
            setDisplay('0');
            setExpression('');
        }
    };
    
    const handleSpecial = (char: string) => {
        if (display === '0' || display === 'Error') {
            setDisplay(char);
            setExpression(char);
        } else {
            setDisplay(prev => prev + char);
            setExpression(prev => prev + char);
        }
    }

    const buttons = [
        { label: 'sin', action: () => handleFunction('sin'), type: 'func' },
        { label: 'cos', action: () => handleFunction('cos'), type: 'func' },
        { label: 'tan', action: () => handleFunction('tan'), type: 'func' },
        { label: 'DEL', action: handleBackspace, type: 'del' },
        { label: 'AC', action: handleClear, type: 'clear' },
        
        { label: 'log', action: () => handleFunction('log'), type: 'func' },
        { label: 'ln', action: () => handleFunction('ln'), type: 'func' },
        { label: '(', action: () => handleInput('('), type: 'num' },
        { label: ')', action: () => handleInput(')'), type: 'num' },
        { label: '÷', action: () => handleOperator('/'), type: 'op' },

        { label: '√', action: () => handleFunction('√'), type: 'func' },
        { label: '7', action: () => handleInput('7'), type: 'num' },
        { label: '8', action: () => handleInput('8'), type: 'num' },
        { label: '9', action: () => handleInput('9'), type: 'num' },
        { label: '×', action: () => handleOperator('*'), type: 'op' },

        { label: 'x²', action: () => handleInput('**2'), type: 'func' },
        { label: '4', action: () => handleInput('4'), type: 'num' },
        { label: '5', action: () => handleInput('5'), type: 'num' },
        { label: '6', action: () => handleInput('6'), type: 'num' },
        { label: '−', action: () => handleOperator('-'), type: 'op' },
        
        { label: 'π', action: () => handleSpecial('π'), type: 'func' },
        { label: '1', action: () => handleInput('1'), type: 'num' },
        { label: '2', action: () => handleInput('2'), type: 'num' },
        { label: '3', action: () => handleInput('3'), type: 'num' },
        { label: '+', action: () => handleOperator('+'), type: 'op' },
        
        { label: 'e', action: () => handleSpecial('e'), type: 'func' },
        { label: '%', action: () => handleOperator('/100*'), type: 'op' },
        { label: '0', action: () => handleInput('0'), type: 'num' },
        { label: '.', action: () => handleInput('.'), type: 'num' },
        { label: '=', action: calculate, type: 'equal' },
    ];
    
    const getButtonClass = (type: string) => {
        switch(type) {
            case 'op': return 'bg-amber-500 hover:bg-amber-600 text-white';
            case 'del': return 'bg-green-600 hover:bg-green-700 text-white';
            case 'clear': return 'bg-green-600 hover:bg-green-700 text-white';
            case 'equal': return 'bg-green-500 hover:bg-green-600 text-white';
            case 'func': return 'bg-muted hover:bg-muted/80';
            default: return 'bg-secondary hover:bg-secondary/80';
        }
    };


    return (
        <div className="flex h-dvh flex-col bg-background text-foreground">
            <header className="flex h-16 flex-shrink-0 items-center border-b px-4 relative">
                <Link href="/tool" className="p-2 -ml-2 absolute left-4">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-xl font-bold mx-auto">Scientific Calculator</h1>
            </header>

            <main className="flex-1 p-4 flex flex-col justify-end">
                <div className="bg-card text-card-foreground rounded-xl p-4 mb-4 shadow-inner border">
                     <div className="text-right text-muted-foreground text-sm h-6 break-all truncate">{expression || ' '}</div>
                     <div className="text-right text-4xl font-bold h-12 break-all truncate">{display}</div>
                     <div className='flex justify-end mt-2'>
                        <Button
                            size="sm"
                            variant={angleMode === 'DEG' ? 'secondary' : 'ghost'}
                            onClick={() => setAngleMode('DEG')}
                        >DEG</Button>
                        <Button
                            size="sm"
                            variant={angleMode === 'RAD' ? 'secondary' : 'ghost'}
                            onClick={() => setAngleMode('RAD')}
                        >RAD</Button>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                    {buttons.map((btn, i) => (
                        <CalcButton key={i} onClick={btn.action} className={getButtonClass(btn.type)}>
                           {btn.label}
                        </CalcButton>
                    ))}
                </div>
            </main>
        </div>
    );
}

    