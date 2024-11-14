function Alumnus({alumnus}) {
    return (
        <tr className="border-t border-gray-200">
          <td class="p3">{alumnus.name}</td>
          <td class="p3">{alumnus.title}</td>
          <td class="p3">
            <a href={alumnus.linkedin}>
              LinkedIn
            </a>
          </td>
          <td class="p3">{alumnus.industry}</td>
          <td class="p3">{alumnus.company}</td>
          <td class="p3">{alumnus.role}</td>
    </tr>
    );
}

export default Alumnus;