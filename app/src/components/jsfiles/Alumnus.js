import { Linkedin } from "lucide-react";

function Alumnus({ alumnus }) {
  return (
    <tr className="border-b">
      <td className="py-3 px-4 font-bold text-purple-700">{alumnus.name}</td> {/* Bold and Purple */}
      <td className="py-3 px-4">{alumnus.title}</td>
      <td className="py-3 px-4">
        <a
          href={alumnus.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-500 hover:underline flex justify-center items-center"
        >
          <Linkedin className="w-5 h-5" />
        </a>
      </td>
      <td className="py-3 px-4">{alumnus.company}</td>
      <td className="py-3 px-4 text-center">
        <button
         className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full flex justify-center items-center"
        >
          <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l8-8m0 0l8 8m-8-8v16" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

export default Alumnus;
