import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { useMemo } from "react";

const chartConfig = {
  probability: {
    label: "Probability",
    theme: {
      light: "hsl(220 80% 56%)",
      dark: "hsl(220 80% 65%)",
    },
  },
} satisfies ChartConfig;

type ResultsViewProps = {
    measurements?: number; //"?" because values are still not yet available
    numberQubits: number;
};

export function ResultsView({ numberQubits }: ResultsViewProps) {
    // Generate dummy data dynamically
    const chartData = useMemo(() => {
        return Array.from({ length: numberQubits }, (_, i) => ({
            qubit: `q${i}`,
            probability: Math.floor(Math.random() * 500) + 1, // random between 1–500
        }));
    }, [numberQubits]);

    return (
        <Card className="w-full">
            <CardHeader className="w-full">
                <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart accessibilityLayer data={chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="qubit"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="probability" fill="var(--color-probability)" radius={8} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
