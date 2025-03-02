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
      return { text: "Processing...", color: "bg-yellow-500" };
    case "NOT_STARTED":
      return { text: "Not Started", color: "bg-gray-500" };
    case "FAILED":
      return { text: "Failed", color: "bg-red-500" };
    case "COMPLETED":
      return { text: "Completed", color: "bg-green-500" };
    default:
      return { text: "Unknown", color: "bg-gray-500" };
  }
};

export default function App({
  projectDetails,
}: {
  projectDetails: ProjectDetailsArray;
}) {
  const router = useRouter();

  return (
    <Table isStriped aria-label="Project details table">
      <TableHeader>
        <TableColumn className="text-left  border-l border-t border-b border-black">
          Project Name
        </TableColumn>
        <TableColumn className="text-left  border-t border-b border-black">
          Created At
        </TableColumn>
        <TableColumn className="text-left border-t border-b border-r border-black">
          Status
        </TableColumn>
      </TableHeader>
      <TableBody>
        {projectDetails.length > 0 ? (
          projectDetails.map((project) => {
            const { text, color } = getStatusBadge(project.status);
            return (
              <TableRow
                key={project.id}
                className="cursor-pointer transition duration-200 hover:shadow-lg hover:bg-white border border-black  rounded-lg"
                onClick={() => {
                  router.push(`/view-project/${project.userId}/${project.id}`);
                }}
              >
                <TableCell className="text-left">{project.title}</TableCell>
                <TableCell className="text-left">
                  {project.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-left">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium text-black ${color}`}
                  >
                    {text === "Processing..." && (
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
                    )}
                    {text}
                  </span>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell className="text-left">No projects available</TableCell>
            <TableCell>&nbsp;</TableCell>
            <TableCell>&nbsp;</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
