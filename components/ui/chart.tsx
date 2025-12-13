"use client"

import * as React from "react"
import { type AxisOptions, Chart as ChartJS, type ChartData, type ChartOptions, Legend, LinearScale, LineElement, PointElement, TimeScale, Tooltip } from "chart.js"
import { Chart as RechartsChart, type LegendProps, type TooltipProps, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend, Pie, PieChart, Cell, LineChart, Line, BarChart, Bar, AreaChart, Area } from "recharts"
import { cn } from "@/lib/utils"

import { LineChart as RechartsLineChart } from "recharts"

// Register ChartJS components
ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

// Recharts Chart Components
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config?: any
    children: React.ReactNode
  }
>(({ id, className, children, ...props }, ref) => (
  <div
    data-chart={id}
    ref={ref}
    className={cn(
      "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke^='#"]]:stroke-border/50 [&_.recharts-curve[stroke^='#']]:stroke-2 [&_.recharts-dot[fill^='#']]:stroke-border [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke^='#']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke^='#']]:stroke-border [&_.recharts-sector[stroke^='#']]:stroke-border [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
      className
    )}
    {...props}
  >
    <ChartContext.Provider value={{ config }}>
      {children}
    </ChartContext.Provider>
  </div>
))
ChartContainer.displayName = "ChartContainer"

const ChartContext = React.createContext<any>({})

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer")
  }
  return context
}

// Recharts Tooltip Component
const ChartTooltipContent = ({
  active,
  payload,
  className
}: {
  active?: boolean
  payload?: any[]
  className?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className={cn(
        "rounded-lg border bg-background p-2 shadow-sm",
        className
      )}>
        <div className="grid gap-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                {entry.name}
              </span>
              <span className="font-bold text-muted-foreground">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

const ChartTooltip = RechartsTooltip

// Recharts Legend Component
const ChartLegendContent = ({
  className,
  payload
}: {
  className?: string
  payload?: any[]
}) => {
  if (!payload || payload.length === 0) {
    return null
  }

  return (
    <div className={cn("flex items-center justify-center gap-4", className)}>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

const ChartLegend = RechartsLegend

// Recharts components for different chart types
const LineChartComponent = React.forwardRef<any, React.ComponentProps<typeof RechartsLineChart>>(
  ({ data, ...props }, ref) => {
    return (
      <RechartsLineChart data={data} {...props}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
      </RechartsLineChart>
    )
  }
)
LineChartComponent.displayName = "LineChartComponent"

const BarChartComponent = React.forwardRef<any, React.ComponentProps<typeof BarChart>>(
  ({ data, ...props }, ref) => {
    return (
      <BarChart data={data} {...props}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        <Bar dataKey="value" fill="hsl(var(--primary))" />
      </BarChart>
    )
  }
)
BarChartComponent.displayName = "BarChartComponent"

const PieChartComponent = React.forwardRef<any, React.ComponentProps<typeof PieChart>>(
  ({ data, ...props }, ref) => {
    const COLORS = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ]

    return (
      <PieChart {...props}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
      </PieChart>
    )
  }
)
PieChartComponent.displayName = "PieChartComponent"

const AreaChartComponent = React.forwardRef<any, React.ComponentProps<typeof AreaChart>>(
  ({ data, ...props }, ref) => {
    return (
      <AreaChart data={data} {...props}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend content={<ChartLegendContent />} />
        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
      </AreaChart>
    )
  }
)
AreaChartComponent.displayName = "AreaChartComponent"

// Helper functions
function getPayloadConfigFromPayload(config: any, payload: any, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }
  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined
  let configLabelKey = key

  if (
    key in payload &&
    typeof key in payload === "string"
  ) {
    configLabelKey = payload[key as string] as string
  }
  if (
    payloadPayload &&
    key in payloadPayload &&
    typeof key in payloadPayload === "string"
  ) {
    configLabelKey = payloadPayload[key as string] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config]
}

// Export all components
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  LineChartComponent,
  BarChartComponent,
  PieChartComponent,
  AreaChartComponent,
  ChartContext,
  useChart,
}