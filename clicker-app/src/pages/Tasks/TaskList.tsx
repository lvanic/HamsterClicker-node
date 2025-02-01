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
            className="py-3 px-4 my-2 bg-[#1D1932] rounded-2xl flex justify-between items-center shadow-sm relative overflow-hidden"
            onClick={() => handleTaskClick(task)}
          >
            <img
              className="absolute w-full h-full left-0 top-0"
              src="/img/task-mask.png"
            />
            <div className="w-full flex flex-row justify-left items-center">
              <img
                src={task.avatarUrl}
                className="mr-2 rounded-full w-8 h-8"
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
                  <img src="/img/bag.png" className="w-4"/>
                  <div className="ml-2 text-lg">+{task.rewardAmount}</div>
                </span>
              </div>
            </div>

            {task.completed ? (
              <div className="px-4 py-2 ms-2 text-white rounded-full hover:bg-opacity-50 transition duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  fill="currentColor"
                  className="bi bi-check2"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill="#8F919D"
                    d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0"
                  />
                </svg>
              </div>
            ) : (
              <button className="px-6 py-2 ms-2 bg-[#439750] text-white rounded-xl hover:bg-opacity-50 transition duration-300">
                Start
              </button>
            )}
          </li>
        ))}
    </>
  );
};
