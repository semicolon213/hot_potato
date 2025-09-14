import useCalendarContext from "../../hooks/useCalendarContext.ts";

const SelectedDate = () => {
    const { selectedDate } = useCalendarContext();
    return <div>{selectedDate.date}</div>;
};

export default SelectedDate;