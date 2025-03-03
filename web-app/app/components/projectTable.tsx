"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";

interface ProjectDetailsProps {
  userId: string;
  title: string;
  createdAt: Date;
  id: string;
  status: string;
}

type ProjectDetailsArray = ProjectDetailsProps[];

// Utility function to get status badge details
const getStatusBadge = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
      return {
        text: "Processing...",
        color: "bg-yellow-500",
        dot: "bg-yellow-800",
      };
    case "NOT_STARTED":
      return { text: "Not Started", color: "bg-gray-500", dot: "bg-gray-700" };
    case "FAILED":
      return { text: "Failed", color: "bg-red-500", dot: "bg-red-800" };
    case "COMPLETED":
      return { text: "Completed", color: "bg-green-500", dot: "bg-green-800" };
    default:
      return { text: "Unknown", color: "bg-gray-500", dot: "bg-gray-700" };
  }
};

export default function App({
  projectDetails,
}: {
  projectDetails: ProjectDetailsArray;
}) {
  const router = useRouter();

  return (
    <Table
      isStriped
      aria-label="Project details table"
      className="border border-gray-300"
    >
      <TableHeader>
        <TableColumn className="text-left px-4 py-3 ">Project Name</TableColumn>
        <TableColumn className="text-left px-4 py-3 ">Created At</TableColumn>
        <TableColumn className="text-left px-4 py-3">Status</TableColumn>
      </TableHeader>
      <TableBody>
        {projectDetails.length > 0 ? (
          projectDetails.map((project) => {
            const { text, color, dot } = getStatusBadge(project.status);
            return (
              <TableRow
                key={project.id}
                className="even:bg-gray-100 hover:bg-gray-50 border border-gray-300 transition duration-200 rounded-lg"
              >
                <TableCell
                  className="text-left px-4 py-3 cursor-pointer font-medium hover:underline"
                  onClick={() => {
                    if (project.status == "NOT_STARTED") {
                      router.push(`/build-project/${project.id}`);
                      return;
                    }

                    router.push(
                      `/view-project/${project.userId}/${project.id}`
                    );
                  }}
                >
                  {project.title}
                </TableCell>
                <TableCell className="text-left px-4 py-3">
                  {project.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-left px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-white ${color}`}
                  >
                    <div className={`h-2 w-2 rounded-full ${dot}`}></div>
                    {text}
                  </span>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell className="text-left px-4 py-3" colSpan={3}>
              No projects available
            </TableCell>
            <TableCell>&nbsp;</TableCell>
            <TableCell>&nbsp;</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
