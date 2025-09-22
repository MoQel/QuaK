import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

const chartData = [
    { qubit: "q0", probability: 186 },
    { qubit: "q1", probability: 305 },
    { qubit: "q2", probability: 237 },
    { qubit: "q3", probability: 73 },
    { qubit: "q4", probability: 209 },
]

const chartConfig = {
    probability: {
        label: "Probability",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function ResultsView() {
    return (
        <Card className="w-full">
            <CardHeader className="w-full">
                <CardTitle>
                    Results
                </CardTitle>
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
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="probability" fill="var(--color-probability)" radius={8} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
