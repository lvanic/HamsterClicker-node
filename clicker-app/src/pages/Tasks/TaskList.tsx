import { ArrowSvg } from "../../components/ArrowSvg";
import { SmallEggSvg } from "../../components/SmallEggSvg";

export const TaskList = ({
  tasks,
  handleTaskClick,
  filter,
}: {
  tasks: any;
  handleTaskClick: any;
  filter: string;
}) => {
  return (
    <>
      {tasks
        .filter((t: any) => t.type != filter)
        .map((task: any) => (
          <li
            key={task.id}
            className="p-1 my-2 bg-[#434A54] rounded-md flex justify-between items-center shadow-sm"
            onClick={() => handleTaskClick(task)}
          >
            <div className="w-full flex flex-row justify-left items-center">
              <img
                src={task.avatarUrl}
                className="mr-2 rounded-full w-16 h-16"
              />
              <div>
                <span
                  className={
                    task.completed
                      ? "text-xs text-gray-500 line-through leading-none"
                      : "text-xs text-white leading-none"
                  }
                >
                  {task.name}
                </span>
                <span className="flex felx-row justify-left ml-2 items-center">
                  <SmallEggSvg />
                  <div className="ml-2 text-lg">+{task.rewardAmount}</div>
                </span>
              </div>
            </div>

            {task.completed ? (
              <span className="text-green-600 font-bold"> (completed)</span>
            ) : (
              <button className="px-4 py-2 ms-2 text-white rounded-full hover:bg-opacity-50 transition duration-300">
                <ArrowSvg />
              </button>
            )}
          </li>
        ))}
    </>
  );
};
