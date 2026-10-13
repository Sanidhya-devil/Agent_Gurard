from setuptools import setup, find_packages

setup(
    name="agentguard",
    version="1.0.0",
    description="Python SDK for AgentGuard: Autonomous AI Governance & Fail-Closed Control Plane",
    author="AgentGuard Team",
    packages=find_packages(),
    install_requires=[
        "requests>=2.28.0",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
)
