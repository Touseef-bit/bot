import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import './App.css'

interface messages {
  id:string,
  message:string
}

function App() {
  const [value, setvalue] = useState<string>("");
  const [messages, setmessages] = useState<messages[]>([]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setvalue(e.target.value);
  };
  const handleClick = (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setmessages([...messages, {id:uuidv4(),message:value}]);
    setvalue("")
  };
  return (
    <>
      <div className="w-full h-screen flex justify-center items-center">
        <main className="w-1/2 h-3/4 flex flex-col px-4 rounded-xl bg-gray-200">
          <div className="h-96 overflow-auto pb-4  flex mt-4 gap-5 px-4 flex-col">
            {messages &&
              messages.map((el) => {
                return (
                  <span key={el.id} className="px-6 py-1 bg-blue-600 rounded-2xl text-white self-end">{el.message}</span>
                );
              })}
            <span className="px-6 py-1 bg-blue-600 rounded-2xl text-white self-start">
              Hi
            </span>
          </div>
          <form onSubmit={handleClick} className="flex mb-4 grow px-4 w-full">
            <input
              type="text"
              className="grow-4 outline-none mr-4 rounded-2xl bg-white px-3 focus:border-blue-600 focus:border-2 duration-100 "
              placeholder="type Something..."
              onChange={handleChange}
              value={value!}
            />
            <button  className="outline-none cursor-pointer hover:bg-blue-700 rounded-2xl bg-blue-600 text-white px-2 py-1 grow">
              Send
            </button>
          </form>
        </main>
      </div>
    </>
  );
}

export default App;
