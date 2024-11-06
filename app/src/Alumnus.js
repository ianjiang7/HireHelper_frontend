function Alumnus({alumnus}) {
    return (
      <div>
        <tr>
          <td>{alumnus.name}</td>
          <td>{alumnus.title}</td>
          <td>
            <a href={alumnus.linkedin}>
              LinkedIn
            </a>
          </td>
          <td>{alumnus.industry}</td>
    </tr>
      </div>
    );
}

export default Alumnus;