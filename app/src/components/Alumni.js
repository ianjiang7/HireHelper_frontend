import Alumnus from './Alumnus'

function Alumni({industry, job, customJob, page, jobSearch, company}) {
    if(job!=="Other") {
      customJob = job
    }
    const alumni = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/person/search/?industry=${industry}&job=${customJob}&page=${page}&title=${jobSearch}&company=${company}`,
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    return (
      <div>
        <table className="w-full bg-white shadow-md rounded-lg" style ={{borderCollapse:'collapse'}}>
            <thead className="bg-gray-200 text-gray-700">
              <tr className="border-t border-gray-200">
                <th>Name</th>
                <th>Title</th>
                <th>LinkedIn</th>
                <th>Industry</th>
                <th>Company</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody >
            {Object.values(alumni).map((alumnus, index) => (
                <Alumnus key={index} alumnus={alumnus} />
            ))}
            </tbody>
        </table>
      </div>
    );
}

export default Alumni;
