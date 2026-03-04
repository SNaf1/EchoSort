"use client";

import { ResponsiveLine } from "@nivo/line";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendPoint } from "@/lib/types";

type TrendChartProps = {
  points: TrendPoint[];
};

function sumBy(points: TrendPoint[], key: keyof Omit<TrendPoint, "x">) {
  return points.reduce((accumulator, point) => accumulator + point[key], 0);
}

export function TrendChart({ points }: TrendChartProps) {
  const openedTotal = sumBy(points, "opened");
  const resolvedTotal = sumBy(points, "resolved");
  const highPriorityTotal = sumBy(points, "highPriority");
  const negativeTotal = sumBy(points, "negative");

  return (
    <Card className="glass-panel border-border/60 bg-card/50">
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">Ticket Trend Intelligence (14 days)</CardTitle>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Opened</p>
            <p className="text-lg font-semibold">{openedTotal}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Resolved</p>
            <p className="text-lg font-semibold">{resolvedTotal}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">High Priority Opened</p>
            <p className="text-lg font-semibold">{highPriorityTotal}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Negative Opened</p>
            <p className="text-lg font-semibold">{negativeTotal}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveLine
            data={[
              {
                id: "Opened",
                data: points.map((point) => ({ x: point.x, y: point.opened })),
              },
              {
                id: "Resolved",
                data: points.map((point) => ({ x: point.x, y: point.resolved })),
              },
              {
                id: "High Priority",
                data: points.map((point) => ({ x: point.x, y: point.highPriority })),
              },
              {
                id: "Negative",
                data: points.map((point) => ({ x: point.x, y: point.negative })),
              },
            ]}
            margin={{ top: 14, right: 26, bottom: 78, left: 42 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
            enableGridX={false}
            curve="catmullRom"
            lineWidth={2.5}
            colors={[
              "hsl(167 90% 68%)",
              "hsl(149 75% 55%)",
              "hsl(39 95% 59%)",
              "hsl(350 90% 67%)",
            ]}
            pointSize={6}
            pointBorderWidth={2}
            pointColor="#18211f"
            pointBorderColor={{ from: "serieColor" }}
            useMesh
            enableSlices="x"
            legends={[
              {
                anchor: "bottom",
                direction: "row",
                justify: false,
                translateY: 64,
                itemWidth: 94,
                itemHeight: 16,
                symbolSize: 8,
                symbolShape: "circle",
              },
            ]}
            theme={{
              text: {
                fill: "hsl(180 6% 76%)",
                fontSize: 11,
              },
              axis: {
                ticks: {
                  line: { stroke: "hsl(180 5% 35%)", strokeWidth: 1 },
                },
                legend: {
                  text: { fill: "hsl(180 6% 76%)" },
                },
                domain: {
                  line: { stroke: "hsl(180 5% 35%)", strokeWidth: 1 },
                },
              },
              grid: {
                line: { stroke: "hsl(180 5% 28%)", strokeWidth: 1 },
              },
              crosshair: {
                line: { stroke: "hsl(167 90% 68%)", strokeWidth: 1 },
              },
              tooltip: {
                container: {
                  background: "rgba(12, 16, 16, 0.96)",
                  color: "white",
                  borderRadius: 10,
                },
              },
            }}
            axisBottom={{
              tickRotation: -20,
              tickPadding: 12,
              tickSize: 0,
            }}
            axisLeft={{
              tickPadding: 8,
              tickSize: 0,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
