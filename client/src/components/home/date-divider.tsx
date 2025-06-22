interface DateDividerProps {
  date: string
}

const DateDivider = ({ date }: DateDividerProps) => {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="bg-base-200 px-3 py-1 rounded-full">
        <span className="text-xs font-medium text-base-content/70">{date}</span>
      </div>
    </div>
  )
}

export default DateDivider
