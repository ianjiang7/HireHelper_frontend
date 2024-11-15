import { useState, useEffect } from "react";
import Alumnus from "./Alumnus";

function Alumni({ industry, job, customJob, jobSearch, company }) {
  const [alumni, setAlumni] = useState([]);
  const [page, setPage] = useState(1);

  // Adjust customJob if the job is not "Other"
  if (job !== "Other") {
    customJob = job;
  }

  useEffect(() => {
    const getAlumni = async () => {
      try {
        const response = await fetch(
          `/person/search/?industry=${industry}&job=${customJob}&page=${page}&title=${jobSearch}&company=${company}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        const alumniArray = Object.values(data);
        setAlumni(alumniArray);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    getAlumni();
  }, [industry, customJob, page, jobSearch, company]);

  return (
    <div>
      <table className="w-full bg-white shadow-lg rounded-md">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="py-3 px-4 text-left">Name</th>
            <th className="py-3 px-4 text-left">Title</th>
            <th className="py-3 px-4 text-left">LinkedIn</th>
            <th className="py-3 px-4 text-left">Industry</th>
            <th className="py-3 px-4 text-left">Company</th>
            <th className="py-3 px-4 text-left">Role</th>
          </tr>
        </thead>
        <tbody>
          {alumni.length > 0 ? (
            alumni.map((alumnus, index) => <Alumnus key={index} alumnus={alumnus} />)
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-4 text-gray-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex justify-center mt-4 space-x-4">
        <button
          className="bg-gray-500 text-white px-4 py-2 rounded-md disabled:opacity-50"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        {alumni.length > 0 && (
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded-md"
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default Alumni;
