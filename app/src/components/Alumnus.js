import { Linkedin } from "lucide-react";

function Alumnus({ alumnus }) {
  return (
    <tr className="border-b">
      <td className="py-3 px-4">{alumnus.name}</td>
      <td className="py-3 px-4">{alumnus.title}</td>
      <td className="py-3 px-4">
        <a
          href={alumnus.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex justify-center items-center" // Centering the icon
        >
          <Linkedin className="w-5 h-5" /> {/* Only the icon */}
        </a>
      </td>
      <td className="py-3 px-4">{alumnus.industry}</td>
      <td className="py-3 px-4">{alumnus.company}</td>
      <td className="py-3 px-4">{alumnus.role}</td>
    </tr>
  );
}

export default Alumnus;
