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
      <td className="py-3 px-4">{alumnus.industry}</td>
      <td className="py-3 px-4">{alumnus.company}</td>
    </tr>
  );
}

export default Alumnus;
