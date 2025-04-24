import os
import streamlit as st
from crewai import Agent, Task, Crew, LLM
from crewai_tools import SerperDevTool, WebsiteSearchTool
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Configure API keys
# Replace these with your actual API keys or use environment variables
os.environ["SERPER_API_KEY"] = "" # serper.dev API key
os.environ["OPENAI_API_KEY"] = ""

# Initialize CrewAI tools
search_tool = SerperDevTool()
web_search_tool = WebsiteSearchTool()
# scholar_tool = ScholarAI()  # For academic research papers

# Configure the model
model_agent = LLM(
    model="openai/gpt-4o"  # Using a more advanced model for educational content
)

# Title and Introduction
st.title("Teacher's Lecture Prep Assistant")
st.write("Your AI-powered assistant for creating engaging and informative lectures!")

# Streamlit User Inputs
st.sidebar.header("Lecture Specifications:")

subject = st.sidebar.selectbox(
    "Subject Area", 
    options=["Mathematics", "Science", "History", "Literature", "Computer Science", 
             "Arts", "Physical Education", "Social Studies", "Language", "Other"]
)

grade_level = st.sidebar.selectbox(
    "Grade Level", 
    options=["Elementary (K-5)", "Middle School (6-8)", "High School (9-12)", 
             "Undergraduate", "Graduate", "Adult Education"]
)

specific_topic = st.sidebar.text_input("Specific Topic", 
                                       placeholder="e.g., Photosynthesis, World War II, Algebra")

lecture_duration = st.sidebar.slider("Lecture Duration (minutes)", 
                                    min_value=15, max_value=180, value=60, step=15)

teaching_style = st.sidebar.multiselect(
    "Preferred Teaching Style",
    options=["Lecture-based", "Interactive", "Problem-based learning", "Discussion-oriented", 
             "Visual learning", "Practical/hands-on", "Flipped classroom"],
    default=["Lecture-based", "Interactive"]
)

content_emphasis = st.sidebar.slider(
    "Content vs. Engagement Balance",
    min_value=0, max_value=100, value=50,
    help="0 = Pure information, 100 = Maximum engagement"
)

include_activities = st.sidebar.checkbox("Include classroom activities", value=True)
include_assessment = st.sidebar.checkbox("Include assessment questions", value=True)
include_visual_aids = st.sidebar.checkbox("Generate visual aid suggestions", value=True)
include_resources = st.sidebar.checkbox("Include additional resources", value=True)

advanced_options = st.sidebar.expander("Advanced Options")
with advanced_options:
    focus_on_recent_research = st.checkbox("Focus on recent research breakthroughs", value=False)
    culturally_responsive = st.checkbox("Culturally responsive teaching", value=False)
    accessibility_focus = st.checkbox("Focus on accessibility", value=False)
    differentiation_strategies = st.checkbox("Include differentiation strategies", value=False)
    
    special_requirements = st.text_area("Any special requirements?", 
                                        placeholder="e.g., Must incorporate specific material, language considerations, etc.")

# Create User Input Dictionary
user_inputs = {
    "subject": subject,
    "grade_level": grade_level,
    "specific_topic": specific_topic,
    "lecture_duration": lecture_duration,
    "teaching_style": teaching_style,
    "content_emphasis": content_emphasis,
    "include_activities": include_activities,
    "include_assessment": include_assessment,
    "include_visual_aids": include_visual_aids,
    "include_resources": include_resources,
    "focus_on_recent_research": focus_on_recent_research,
    "culturally_responsive": culturally_responsive,
    "accessibility_focus": accessibility_focus,
    "differentiation_strategies": differentiation_strategies,
    "special_requirements": special_requirements
}

# Agent Backstories and Roles

content_researcher_backstory = """
You are an expert academic researcher with extensive knowledge across multiple disciplines.
You have access to the latest research papers, educational journals, and academic resources.
Your strength is in finding accurate, curriculum-aligned content while highlighting recent breakthroughs
and developments in the field. You contextualize information appropriately for the target audience's grade level.
"""

engagement_specialist_backstory = """
You are an educational engagement expert who specializes in creating interactive and memorable learning experiences.
Your expertise includes developing thought-provoking questions, designing interactive activities,
and uncovering fascinating facts that capture students' interest. You have a deep understanding
of various learning styles and know how to make complex topics relatable and engaging.
"""

lecture_designer_backstory = """
You are a master educator with years of experience in curriculum design and instructional planning.
You excel at structuring information in a logical, coherent flow that optimizes student comprehension.
Your particular talent is in crafting narratives that connect concepts, creating transitions between topics,
and developing scaffolded approaches that build on prior knowledge while introducing new concepts effectively.
"""

material_compiler_backstory = """
You are a skilled educational content producer who specializes in creating polished, professional
teaching materials. You have exceptional organizational skills and an eye for pedagogical design.
You can transform raw content into comprehensive, ready-to-use lecture materials including
presentation outlines, visual aid specifications, discussion guides, and assessment tools.
"""

# Implementation of Agents with multiple tools

content_researcher = Agent(
    role="Academic Content Researcher",
    goal="Find accurate, curriculum-aligned content and recent research breakthroughs",
    backstory=content_researcher_backstory,
    verbose=True,
    allow_delegation=True,
    tools=[search_tool, web_search_tool],
    llm=model_agent
)

engagement_specialist = Agent(
    role="Educational Engagement Specialist",
    goal="Create engaging questions, activities, and fun facts to enhance student interest",
    backstory=engagement_specialist_backstory,
    verbose=True,
    allow_delegation=True,
    tools=[search_tool, web_search_tool],
    llm=model_agent
)

lecture_designer = Agent(
    role="Lecture Structure Designer",
    goal="Design logical, effective lecture flow with clear connections between concepts",
    backstory=lecture_designer_backstory,
    verbose=True,
    allow_delegation=True,
    tools=[search_tool, web_search_tool],
    llm=model_agent
)

material_compiler = Agent(
    role="Educational Material Compiler",
    goal="Compile all content into a polished, comprehensive lecture package",
    backstory=material_compiler_backstory,
    verbose=True,
    allow_delegation=True,
    tools=[search_tool, web_search_tool],
    llm=model_agent
)

# Tasks
task1 = Task(
    description=f"""
    Research the topic "{specific_topic}" for a {grade_level} {subject} class based on these specifications:
    - Identify core curriculum concepts that must be covered
    - Find recent research breakthroughs or developments (if specified: {focus_on_recent_research})
    - Gather factual information appropriate for a {lecture_duration}-minute lecture
    - Consider any special requirements: {special_requirements}
    
    User has provided the following information about their needs: {user_inputs}
    
    Research both fundamental concepts and cutting-edge developments. Include relevant statistics, 
    historical context, and current applications. Ensure all information is factually accurate and 
    appropriately leveled for {grade_level} students.
    """,
    expected_output="""Detailed content research including:
    1. Core curriculum concepts with explanations
    2. Recent research or breakthroughs (if applicable)
    3. Key facts, figures, and information
    4. Historical context and development of the topic
    5. Real-world applications and relevance
    """,
    agent=content_researcher,
    async_execution=True
)

task2 = Task(
    description=f"""
    Develop engagement materials for a {grade_level} {subject} lecture on "{specific_topic}" with these specifications:
    - Create {3-5} thought-provoking discussion questions
    - Develop {2-4} interactive classroom activities aligned with teaching style: {teaching_style}
    - Compile {5-10} fascinating facts or surprising information about the topic
    - Design brief engagement moments to distribute throughout the lecture
    - Consider content/engagement balance preference: {content_emphasis}/100
    
    User has provided the following information about their needs: {user_inputs}
    
    Create engaging materials that will stimulate curiosity and critical thinking. Ensure activities 
    are practical to implement and appropriate for {grade_level} students. Include brief "hooks" that 
    can be used throughout the lecture to maintain interest.
    """,
    expected_output="""Engagement materials including:
    1. Discussion questions with potential talking points
    2. Interactive classroom activities with implementation instructions
    3. Fun facts or surprising information
    4. Brief engagement moments/hooks for throughout the lecture
    5. Suggested multimedia elements (videos, images, etc.)
    """,
    agent=engagement_specialist,
    async_execution=True
)

task3 = Task(
    description=f"""
    Design a logical lecture structure for a {lecture_duration}-minute {subject} lecture on "{specific_topic}" for {grade_level} students:
    - Create a minute-by-minute outline of the lecture flow
    - Design introduction that hooks student interest
    - Organize main content in logical progression
    - Include strategic placement of activities and engagement elements
    - Develop conclusion that reinforces key concepts
    - Consider teaching style preference: {teaching_style}
    
    User has provided the following information about their needs: {user_inputs}
    
    Create a lecture structure that maximizes student comprehension by connecting concepts logically.
    Consider attention spans appropriate for {grade_level} and build in transitions between topics.
    Include timing guidelines for each section to help the teacher pace the lecture appropriately.
    """,
    expected_output="""Detailed lecture structure including:
    1. Minute-by-minute lecture outline
    2. Introduction and hook
    3. Main content progression with timing
    4. Strategic placement of activities/engagement elements
    5. Effective conclusion and key takeaways
    6. Transitions between sections
    """,
    agent=lecture_designer,
    async_execution=True
)

task4 = Task(
    description=f"""
    Compile all research and planning into a comprehensive lecture package for a {lecture_duration}-minute
    {subject} lecture on "{specific_topic}" for {grade_level} students.
    
    The user has requested:
    - Include classroom activities: {include_activities}
    - Include assessment questions: {include_assessment}
    - Include visual aid suggestions: {include_visual_aids}
    - Include additional resources: {include_resources}
    - Focus on recent research: {focus_on_recent_research}
    - Culturally responsive teaching: {culturally_responsive}
    - Accessibility focus: {accessibility_focus}
    - Differentiation strategies: {differentiation_strategies}
    
    Review all content from other agents and compile into a polished, professional lecture package.
    Ensure all elements work together cohesively and flow logically. Add additional elements as needed
    to create a complete, ready-to-use lecture preparation package.
    """,
    expected_output="""Complete lecture preparation package including:
    1. Executive summary of lecture
    2. Detailed lecture script with timing
    3. Key points and content organized by section
    4. Student engagement activities and placement
    5. Visual aid recommendations and descriptions
    6. Assessment questions or strategies
    7. Additional resources and references
    8. Implementation notes and special considerations
    """,
    agent=material_compiler,
    context=[task1, task2, task3]
)

# Create Crew with planning enabled
crew = Crew(
    agents=[content_researcher, engagement_specialist, lecture_designer, material_compiler],
    tasks=[task1, task2, task3, task4],
    verbose=True,
    planning=True
)

# Display tabs for organizing the output
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "Main Output", "Content Research", "Engagement Materials", 
    "Lecture Structure", "Download Materials"
])

# Recommendation Button with improved error handling
if st.sidebar.button("Generate Lecture Materials"):
    if not specific_topic:
        st.error("Please specify a topic for your lecture before generating materials.")
    else:
        with st.spinner("Researching and designing your lecture materials...\nThis may take 3-5 minutes to complete"):
            try:
                crew_output = crew.kickoff()
                
                # Extract task outputs
                content_research = crew_output.tasks_output[0].raw
                engagement_materials = crew_output.tasks_output[1].raw
                lecture_structure = crew_output.tasks_output[2].raw
                final_package = crew_output.tasks_output[3].raw
                
                # Main Output Tab
                with tab1:
                    st.header(f"Lecture Package: {specific_topic}")
                    st.markdown(final_package)
                    
                    # Statistics
                    st.subheader("Generation Statistics")
                    st.markdown(f"""
                    * Total Tokens Used: {crew_output.token_usage.total_tokens:,}
                    * Completion Tokens: {crew_output.token_usage.completion_tokens:,}
                    * Successful Requests: {crew_output.token_usage.successful_requests}
                    """)
                
                # Content Research Tab
                with tab2:
                    st.header("Content Research")
                    st.markdown(content_research)
                
                # Engagement Materials Tab
                with tab3:
                    st.header("Engagement Materials")
                    st.markdown(engagement_materials)
                
                # Lecture Structure Tab
                with tab4:
                    st.header("Lecture Structure")
                    st.markdown(lecture_structure)
                
                # Download Materials Tab
                with tab5:
                    st.header("Download Materials")
                    
                    # Create downloadable content
                    full_content = f"""# Lecture Preparation Package: {specific_topic}
                    
## Subject: {subject}
## Grade Level: {grade_level}
## Duration: {lecture_duration} minutes
## Teaching Style: {', '.join(teaching_style)}
                    
# Content Research
{content_research}

# Engagement Materials
{engagement_materials}

# Lecture Structure
{lecture_structure}

# Complete Lecture Package
{final_package}
                    """
                    
                    # Markdown download button
                    st.download_button(
                        label="Download as Markdown",
                        data=full_content,
                        file_name=f"lecture_{specific_topic.replace(' ', '_')}.md",
                        mime="text/markdown"
                    )
                    
                    # JSON download button
                    json_content = json.dumps({
                        "subject": subject,
                        "grade_level": grade_level,
                        "topic": specific_topic,
                        "duration": lecture_duration,
                        "teaching_style": teaching_style,
                        "content_research": content_research,
                        "engagement_materials": engagement_materials,
                        "lecture_structure": lecture_structure,
                        "final_package": final_package
                    }, indent=2)
                    
                    st.download_button(
                        label="Download as JSON",
                        data=json_content,
                        file_name=f"lecture_{specific_topic.replace(' ', '_')}.json",
                        mime="application/json"
                    )
                    
                    # Tips for using the materials
                    st.subheader("Tips for Using These Materials")
                    st.markdown("""
                    1. **Review and Customize**: Adjust content to fit your teaching style and classroom dynamics
                    2. **Prepare Visual Aids**: Create or gather suggested visual materials ahead of time
                    3. **Set Up Activities**: Gather any materials needed for the interactive elements
                    4. **Time Management**: Use the minute-by-minute guide but be flexible based on student engagement
                    5. **Extension**: Consider how you might extend or adapt topics based on student interest
                    """)
            
            except Exception as e:
                st.error(f"An error occurred: {str(e)}")
                st.info("Please try again or contact support if the issue persists.")