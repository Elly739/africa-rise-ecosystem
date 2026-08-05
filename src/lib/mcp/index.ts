import { defineMcp } from "@lovable.dev/mcp-js";
import listCourses from "./tools/list-courses";
import listOpportunities from "./tools/list-opportunities";
import listChallenges from "./tools/list-challenges";
import listDiscussions from "./tools/list-discussions";

export default defineMcp({
  name: "pioneer-hub-africa-mcp",
  title: "Pioneer Africa Hub MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Pioneer Africa Hub learning and innovation ecosystem. Browse courses, career opportunities, innovation challenges, and community discussions.",
  tools: [listCourses, listOpportunities, listChallenges, listDiscussions],
});
